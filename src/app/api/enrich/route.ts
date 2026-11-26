import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Simple sliding-window in-memory rate limiter (20 lookups / 60s per client)
const rateBuckets = new Map<string, number[]>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

function checkRateLimit(clientKey: string): boolean {
  const now = Date.now();
  const timestamps = (rateBuckets.get(clientKey) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    rateBuckets.set(clientKey, timestamps);
    return false;
  }
  timestamps.push(now);
  rateBuckets.set(clientKey, timestamps);
  return true;
}

function isPrivateIP(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
    ip.startsWith("169.254.")
  );
}

export async function GET(req: Request) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Rate limit exceeded (max 20 enrichment lookups per minute). Please wait briefly." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const kind = (searchParams.get("kind") ?? "").toLowerCase().trim();
  const value = (searchParams.get("value") ?? "").trim();

  if (!value) {
    return NextResponse.json({ error: "Missing artifact value" }, { status: 400 });
  }

  const vtKey = process.env.VIRUSTOTAL_API_KEY;
  const abuseKey = process.env.ABUSEIPDB_API_KEY;

  // 1. IP Address Inspection (Querying BOTH AbuseIPDB and VirusTotal concurrently)
  if (["ip", "ipv4", "ipv6", "src_ip", "dest_ip", "c2_ip"].includes(kind)) {
    // Check if internal / RFC1918
    if (isPrivateIP(value)) {
      return NextResponse.json({
        kind: "ip",
        value,
        verdict: "CLEAN",
        overallScore: 0,
        summary: "RFC1918 Private IP (Internal / Non-Routable)",
        details: {
          classification: "Internal Network Subnet",
          isPrivate: true,
          action: "Internal host investigation recommended if observed in C2 traffic.",
        },
      });
    }

    // Execute AbuseIPDB and VirusTotal in parallel
    const [abuseResult, vtResult] = await Promise.allSettled([
      // AbuseIPDB
      (async () => {
        if (!abuseKey) return null;
        const res = await fetch(
          `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(value)}&maxAgeInDays=90&verbose`,
          {
            headers: {
              Key: abuseKey,
              Accept: "application/json",
            },
            next: { revalidate: 1800 },
          }
        );
        if (!res.ok) return null;
        const json = await res.json();
        return json.data;
      })(),

      // VirusTotal
      (async () => {
        if (!vtKey) return null;
        const res = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${encodeURIComponent(value)}`, {
          headers: { "x-apikey": vtKey },
          next: { revalidate: 1800 },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data;
      })(),
    ]);

    const abuseData = abuseResult.status === "fulfilled" ? abuseResult.value : null;
    const vtData = vtResult.status === "fulfilled" ? vtResult.value : null;

    // Parse AbuseIPDB
    let abuseParsed = null;
    if (abuseData) {
      const score = abuseData.abuseConfidenceScore ?? 0;
      let v: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" = "CLEAN";
      if (score >= 50) v = "MALICIOUS";
      else if (score >= 15) v = "SUSPICIOUS";

      const recentComments = Array.isArray(abuseData.reports)
        ? abuseData.reports
            .map((r: { comment?: string }) => r.comment?.trim())
            .filter((c: string | undefined): c is string => Boolean(c && c.length > 5))
            .slice(0, 3)
        : [];

      abuseParsed = {
        available: true,
        score,
        verdict: v,
        totalReports: abuseData.totalReports || 0,
        numDistinctUsers: abuseData.numDistinctUsers || 0,
        countryCode: abuseData.countryCode,
        countryName: abuseData.countryName,
        isp: abuseData.isp,
        domain: abuseData.domain,
        usageType: abuseData.usageType,
        isTor: Boolean(abuseData.isTor),
        hostnames: abuseData.hostnames || [],
        lastReportedAt: abuseData.lastReportedAt,
        recentComments,
      };
    }

    // Parse VirusTotal
    let vtParsed = null;
    if (vtData) {
      const attrs = vtData.attributes || {};
      const stats = attrs.last_analysis_stats || {};
      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      const harmless = stats.harmless || 0;
      const undetected = stats.undetected || 0;
      const totalVendors = malicious + suspicious + harmless + undetected;

      let v: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" = "CLEAN";
      if (malicious >= 3) v = "MALICIOUS";
      else if (malicious > 0 || suspicious > 0) v = "SUSPICIOUS";

      vtParsed = {
        available: true,
        verdict: v,
        malicious,
        suspicious,
        harmless,
        undetected,
        totalVendors,
        reputation: attrs.reputation ?? 0,
        asOwner: attrs.as_owner,
        network: attrs.network,
        country: attrs.country,
        tags: attrs.tags || [],
      };
    }

    // Determine overall verdict
    let overallVerdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN" = "CLEAN";
    if (abuseParsed?.verdict === "MALICIOUS" || vtParsed?.verdict === "MALICIOUS") {
      overallVerdict = "MALICIOUS";
    } else if (abuseParsed?.verdict === "SUSPICIOUS" || vtParsed?.verdict === "SUSPICIOUS") {
      overallVerdict = "SUSPICIOUS";
    } else if (!abuseParsed && !vtParsed) {
      overallVerdict = "UNKNOWN";
    }

    const summaryParts: string[] = [];
    if (abuseParsed) {
      summaryParts.push(`AbuseIPDB: ${abuseParsed.score}% Confidence (${abuseParsed.totalReports} reports)`);
    }
    if (vtParsed) {
      summaryParts.push(`VirusTotal: ${vtParsed.malicious}/${vtParsed.totalVendors} vendors flagged`);
    }

    return NextResponse.json({
      kind: "ip",
      value,
      verdict: overallVerdict,
      overallScore: Math.max(abuseParsed?.score ?? 0, (vtParsed?.malicious ?? 0) * 10),
      summary: summaryParts.join(" • ") || "Public IP cataloged",
      abuseipdb: abuseParsed,
      virustotal: vtParsed,
      hasApiKey: Boolean(abuseKey || vtKey),
    });
  }

  // 2. Hash Inspection (MD5 / SHA1 / SHA256)
  if (["hash", "sha256", "sha1", "md5"].includes(kind)) {
    if (vtKey) {
      try {
        const res = await fetch(`https://www.virustotal.com/api/v3/files/${encodeURIComponent(value)}`, {
          headers: { "x-apikey": vtKey },
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const data = await res.json();
          const attrs = data.data?.attributes || {};
          const stats = attrs.last_analysis_stats ?? {};
          const malicious = stats.malicious || 0;
          const suspicious = stats.suspicious || 0;
          const harmless = stats.harmless || 0;
          const undetected = stats.undetected || 0;
          const totalVendors = malicious + suspicious + harmless + undetected;

          let verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" = "CLEAN";
          if (malicious >= 5) verdict = "MALICIOUS";
          else if (malicious > 0 || suspicious > 0) verdict = "SUSPICIOUS";

          const threatLabel = attrs.popular_threat_classification?.suggested_threat_label;

          return NextResponse.json({
            kind: "hash",
            value,
            verdict,
            overallScore: malicious,
            summary: `VirusTotal: ${malicious}/${totalVendors} vendors flagged (${attrs.meaningful_name || threatLabel || "Malware"})`,
            virustotal: {
              available: true,
              verdict,
              malicious,
              suspicious,
              harmless,
              undetected,
              totalVendors,
              reputation: attrs.reputation,
              meaningfulName: attrs.meaningful_name,
              fileType: attrs.type_description,
              fileSize: attrs.size,
              threatLabel,
              tags: attrs.tags || [],
            },
            hasApiKey: true,
          });
        }
      } catch (err) {
        console.warn("VirusTotal File API failed:", err);
      }
    }

    const len = value.length;
    const algo = len === 32 ? "MD5" : len === 40 ? "SHA-1" : len === 64 ? "SHA-256" : "Unknown Hash";

    return NextResponse.json({
      kind: "hash",
      value,
      verdict: "UNKNOWN",
      overallScore: 0,
      hasApiKey: false,
      summary: `Valid ${algo} Cryptographic Signature`,
      details: {
        algorithm: algo,
        length: len,
        note: "Add VIRUSTOTAL_API_KEY to .env to fetch automated malware detection ratios.",
      },
    });
  }

  // 3. Domain / C2 URL Inspection
  if (["domain", "c2", "url", "hostname", "fqdn"].includes(kind)) {
    if (vtKey) {
      try {
        const res = await fetch(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(value)}`, {
          headers: { "x-apikey": vtKey },
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const data = await res.json();
          const attrs = data.data?.attributes || {};
          const stats = attrs.last_analysis_stats ?? {};
          const malicious = stats.malicious || 0;
          const suspicious = stats.suspicious || 0;
          const harmless = stats.harmless || 0;
          const undetected = stats.undetected || 0;
          const totalVendors = malicious + suspicious + harmless + undetected;

          let verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" = "CLEAN";
          if (malicious >= 3) verdict = "MALICIOUS";
          else if (malicious > 0 || suspicious > 0) verdict = "SUSPICIOUS";

          return NextResponse.json({
            kind: "domain",
            value,
            verdict,
            overallScore: malicious,
            summary: `VirusTotal: ${malicious}/${totalVendors} vendors flagged domain as malicious`,
            virustotal: {
              available: true,
              verdict,
              malicious,
              suspicious,
              harmless,
              undetected,
              totalVendors,
              reputation: attrs.reputation,
              categories: attrs.categories,
              registrar: attrs.registrar,
              tags: attrs.tags || [],
            },
            hasApiKey: true,
          });
        }
      } catch (err) {
        console.warn("VirusTotal Domain API failed:", err);
      }
    }

    return NextResponse.json({
      kind: "domain",
      value,
      verdict: "UNKNOWN",
      overallScore: 0,
      hasApiKey: false,
      summary: `Domain / FQDN Candidate (${value})`,
      details: {
        note: "Add VIRUSTOTAL_API_KEY to .env for automated categorization and reputation scoring.",
      },
    });
  }

  return NextResponse.json({
    kind,
    value,
    verdict: "CLEAN",
    overallScore: 0,
    summary: `Artifact ${kind} cataloged`,
  });
}
