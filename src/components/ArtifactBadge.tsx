"use client";
import { useState, useEffect } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  X,
  Globe,
  Radio,
  FileCode,
  Layers,
  Server,
  Terminal,
} from "lucide-react";

type ArtifactBadgeProps = {
  kind: string;
  value: string;
};

type AbuseIPDBData = {
  available: boolean;
  verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS";
  score: number;
  totalReports: number;
  numDistinctUsers?: number;
  countryCode?: string;
  countryName?: string;
  isp?: string;
  domain?: string;
  usageType?: string;
  isTor?: boolean;
  hostnames?: string[];
  lastReportedAt?: string;
  recentComments?: string[];
};

type VirusTotalData = {
  available: boolean;
  verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS";
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  totalVendors: number;
  reputation?: number;
  asOwner?: string;
  network?: string;
  country?: string;
  tags?: string[];
  meaningfulName?: string;
  fileType?: string;
  fileSize?: number;
  threatLabel?: string;
  categories?: Record<string, string>;
  registrar?: string;
};

type EnrichResult = {
  kind: string;
  value: string;
  verdict: "CLEAN" | "SUSPICIOUS" | "MALICIOUS" | "UNKNOWN";
  overallScore: number;
  summary: string;
  hasApiKey?: boolean;
  abuseipdb?: AbuseIPDBData;
  virustotal?: VirusTotalData;
  details?: Record<string, any>;
};

export default function ArtifactBadge({ kind, value }: ArtifactBadgeProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichData, setEnrichData] = useState<EnrichResult | null>(null);

  const k = kind.toLowerCase().trim();
  const v = value.trim();

  // Threat Intel lookup URLs
  const links: { name: string; url: string }[] = [];

  if (["ip", "ipv4", "ipv6", "src_ip", "dest_ip", "c2_ip"].includes(k)) {
    links.push(
      { name: "VirusTotal", url: `https://www.virustotal.com/gui/ip-address/${v}` },
      { name: "AbuseIPDB", url: `https://www.abuseipdb.com/check/${v}` },
      { name: "Shodan", url: `https://www.shodan.io/host/${v}` },
      { name: "GreyNoise", url: `https://viz.greynoise.io/ip/${v}` }
    );
  } else if (["hash", "sha256", "sha1", "md5"].includes(k)) {
    links.push(
      { name: "VirusTotal", url: `https://www.virustotal.com/gui/file/${v}` },
      { name: "MalwareBazaar", url: `https://bazaar.abuse.ch/sample/${v}/` }
    );
  } else if (["domain", "c2", "url", "hostname", "fqdn"].includes(k)) {
    links.push(
      { name: "VirusTotal", url: `https://www.virustotal.com/gui/domain/${v}` },
      { name: "urlscan.io", url: `https://urlscan.io/search/#${v}` }
    );
  } else if (["event_id", "eventid", "event"].includes(k)) {
    links.push(
      { name: "Ultimate Windows Security", url: `https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/event.aspx?eventID=${v}` }
    );
  } else if (["technique", "attack_id", "mitre"].includes(k)) {
    links.push(
      { name: "MITRE ATT&CK", url: `https://attack.mitre.org/techniques/${v.replace(".", "/")}/` }
    );
  }

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    await navigator.clipboard.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleLiveCheck = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEnriching(true);
    try {
      const res = await fetch(`/api/enrich?kind=${encodeURIComponent(k)}&value=${encodeURIComponent(v)}`);
      if (res.ok) {
        const data = await res.json();
        setEnrichData(data);
      }
    } catch (err) {
      console.error("Live enrichment failed:", err);
    } finally {
      setEnriching(false);
    }
  };

  // Automatically start live check when modal is first opened
  useEffect(() => {
    if (open && !enrichData && !enriching && links.length > 0) {
      handleLiveCheck();
    }
  }, [open]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  const hasLinks = links.length > 0;

  return (
    <div className="relative inline-block text-left">
      {/* Inline Badge trigger */}
      <div
        onClick={() => hasLinks && setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono transition-colors ${
          enrichData?.verdict === "MALICIOUS"
            ? "border-danger/60 bg-danger/10 text-danger cursor-pointer font-bold"
            : enrichData?.verdict === "SUSPICIOUS"
            ? "border-amber-500/60 bg-amber-500/10 text-amber-500 cursor-pointer"
            : enrichData?.verdict === "CLEAN"
            ? "border-confirmed/50 bg-confirmed/10 text-confirmed cursor-pointer"
            : hasLinks
            ? "cursor-pointer hover:border-steel/60 hover:bg-steel/10 bg-raised text-text border-line"
            : "bg-raised text-muted border-line"
        }`}
        title={hasLinks ? "Click to open full Threat Intelligence Dossier" : undefined}
      >
        <span className="opacity-80 font-semibold">{kind}:</span>
        <span className="max-w-[200px] truncate">{value}</span>
        {enrichData?.verdict && (
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              enrichData.verdict === "MALICIOUS"
                ? "bg-danger animate-pulse"
                : enrichData.verdict === "SUSPICIOUS"
                ? "bg-amber-500"
                : "bg-confirmed"
            }`}
          />
        )}
        {hasLinks && !enrichData && (
          <ExternalLink size={10} className="text-muted shrink-0" />
        )}
      </div>

      {/* Large Threat Intelligence Dossier Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-4xl bg-panel border border-line rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-raised/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-surface border border-line shrink-0">
                  <ShieldAlert className="text-steel" size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                      Threat Intelligence Dossier
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-raised text-steel border border-line">
                      {kind}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h2 className="text-base font-mono font-bold text-text truncate max-w-md sm:max-w-lg">
                      {value}
                    </h2>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1 rounded text-muted hover:text-text hover:bg-raised transition-colors shrink-0"
                      title="Copy artifact value"
                    >
                      {copied ? <Check size={14} className="text-confirmed" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {enrichData?.verdict && (
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                      enrichData.verdict === "MALICIOUS"
                        ? "bg-danger/15 text-danger border-danger/40"
                        : enrichData.verdict === "SUSPICIOUS"
                        ? "bg-amber-500/15 text-amber-500 border-amber-500/40"
                        : enrichData.verdict === "CLEAN"
                        ? "bg-confirmed/15 text-confirmed border-confirmed/40"
                        : "bg-raised text-muted border-line"
                    }`}
                  >
                    {enrichData.verdict === "MALICIOUS" ? (
                      <ShieldAlert size={14} />
                    ) : enrichData.verdict === "SUSPICIOUS" ? (
                      <AlertTriangle size={14} />
                    ) : (
                      <ShieldCheck size={14} />
                    )}
                    {enrichData.verdict}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-raised transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Loading State */}
              {enriching && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <RefreshCw size={28} className="animate-spin text-steel" />
                  <p className="text-sm font-semibold text-text">
                    Performing Live Threat Intelligence Inspection...
                  </p>
                  <p className="text-xs text-muted max-w-sm">
                    Querying VirusTotal v3 and AbuseIPDB live APIs concurrently for reputation, reports, and threat classifications.
                  </p>
                </div>
              )}

              {/* Not loaded yet / Error / Initial */}
              {!enriching && !enrichData && (
                <div className="py-8 text-center space-y-4">
                  <p className="text-sm text-muted">
                    No cached live threat intel for this artifact. Run live lookup across configured APIs.
                  </p>
                  <button
                    type="button"
                    onClick={handleLiveCheck}
                    className="btn-primary py-2 px-5 text-xs inline-flex items-center gap-2"
                  >
                    <RefreshCw size={14} />
                    <span>Run Live Check (VirusTotal + AbuseIPDB)</span>
                  </button>
                </div>
              )}

              {/* Enriched Content */}
              {!enriching && enrichData && (
                <>
                  {/* Summary Banner */}
                  <div className="p-3.5 rounded-lg border border-line bg-raised/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-text font-medium">
                      <Terminal size={14} className="text-steel shrink-0" />
                      <span>{enrichData.summary}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLiveCheck}
                      disabled={enriching}
                      className="text-xs text-steel hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      <RefreshCw size={11} className={enriching ? "animate-spin" : ""} />
                      <span>Re-scan</span>
                    </button>
                  </div>

                  {/* Dual Grid for IP: AbuseIPDB + VirusTotal */}
                  {["ip", "ipv4", "ipv6", "src_ip", "dest_ip", "c2_ip"].includes(k) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* 1. AbuseIPDB Card */}
                      <div className="rounded-lg border border-line bg-surface p-4 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-line/60">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                              <h3 className="font-bold text-xs uppercase tracking-wider text-text">
                                AbuseIPDB Live Intel
                              </h3>
                            </div>
                            {enrichData.abuseipdb?.verdict && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                  enrichData.abuseipdb.verdict === "MALICIOUS"
                                    ? "bg-danger/20 text-danger border-danger/40"
                                    : enrichData.abuseipdb.verdict === "SUSPICIOUS"
                                    ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                                    : "bg-confirmed/20 text-confirmed border-confirmed/40"
                                }`}
                              >
                                {enrichData.abuseipdb.verdict}
                              </span>
                            )}
                          </div>

                          {enrichData.abuseipdb ? (
                            <>
                              {/* Confidence Score Bar */}
                              <div className="space-y-1.5 bg-raised/50 p-3 rounded border border-line/60">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted font-medium">Abuse Confidence Score</span>
                                  <span className="font-bold font-mono text-base text-text">
                                    {enrichData.abuseipdb.score}%
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-panel overflow-hidden border border-line/40">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      enrichData.abuseipdb.score >= 50
                                        ? "bg-danger"
                                        : enrichData.abuseipdb.score >= 15
                                        ? "bg-amber-500"
                                        : "bg-confirmed"
                                    }`}
                                    style={{ width: `${Math.max(enrichData.abuseipdb.score, 4)}%` }}
                                  />
                                </div>
                                <div className="text-[11px] text-muted flex items-center justify-between pt-0.5">
                                  <span>Total Reports: <strong>{enrichData.abuseipdb.totalReports}</strong></span>
                                  {enrichData.abuseipdb.numDistinctUsers !== undefined && (
                                    <span>Reporters: <strong>{enrichData.abuseipdb.numDistinctUsers}</strong></span>
                                  )}
                                </div>
                              </div>

                              {/* Details list */}
                              <div className="text-xs space-y-2 pt-1 font-sans">
                                <div className="flex items-center justify-between py-1 border-b border-line/30">
                                  <span className="text-muted">Country</span>
                                  <span className="font-semibold text-text">
                                    {enrichData.abuseipdb.countryName || enrichData.abuseipdb.countryCode || "Unknown"} ({enrichData.abuseipdb.countryCode})
                                  </span>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-line/30">
                                  <span className="text-muted">ISP / Autonomous System</span>
                                  <span className="font-semibold text-text truncate max-w-[200px]" title={enrichData.abuseipdb.isp}>
                                    {enrichData.abuseipdb.isp || "N/A"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-line/30">
                                  <span className="text-muted">Usage Type</span>
                                  <span className="font-medium text-text">
                                    {enrichData.abuseipdb.usageType || "N/A"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-line/30">
                                  <span className="text-muted">Tor Exit Node</span>
                                  <span>
                                    {enrichData.abuseipdb.isTor ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger/20 text-danger border border-danger/40">
                                        YES (Active Tor Node)
                                      </span>
                                    ) : (
                                      <span className="text-muted">No</span>
                                    )}
                                  </span>
                                </div>

                                {enrichData.abuseipdb.domain && (
                                  <div className="flex items-center justify-between py-1 border-b border-line/30">
                                    <span className="text-muted">Domain</span>
                                    <span className="font-mono text-steel">
                                      {enrichData.abuseipdb.domain}
                                    </span>
                                  </div>
                                )}

                                {enrichData.abuseipdb.lastReportedAt && (
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-muted">Last Reported Activity</span>
                                    <span className="text-muted font-mono text-[11px]">
                                      {new Date(enrichData.abuseipdb.lastReportedAt).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Recent comments snippet */}
                              {enrichData.abuseipdb.recentComments && enrichData.abuseipdb.recentComments.length > 0 && (
                                <div className="space-y-1 pt-2">
                                  <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block">
                                    Recent Community Reports
                                  </span>
                                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                                    {enrichData.abuseipdb.recentComments.map((comment, i) => (
                                      <div
                                        key={i}
                                        className="text-[11px] p-2 rounded bg-ink/50 border border-line/40 text-muted font-mono leading-relaxed"
                                      >
                                        &ldquo;{comment}&rdquo;
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="py-6 text-center text-xs text-muted">
                              No AbuseIPDB data available or lookup skipped.
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-line/50">
                          <a
                            href={`https://www.abuseipdb.com/check/${v}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-steel hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open Full AbuseIPDB Dossier</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>

                      {/* 2. VirusTotal Card */}
                      <div className="rounded-lg border border-line bg-surface p-4 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-line/60">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                              <h3 className="font-bold text-xs uppercase tracking-wider text-text">
                                VirusTotal v3 Live Intel
                              </h3>
                            </div>
                            {enrichData.virustotal?.verdict && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                  enrichData.virustotal.verdict === "MALICIOUS"
                                    ? "bg-danger/20 text-danger border-danger/40"
                                    : enrichData.virustotal.verdict === "SUSPICIOUS"
                                    ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                                    : "bg-confirmed/20 text-confirmed border-confirmed/40"
                                }`}
                              >
                                {enrichData.virustotal.verdict}
                              </span>
                            )}
                          </div>

                          {enrichData.virustotal ? (
                            <>
                              {/* Security Vendors Ratio */}
                              <div className="space-y-2 bg-raised/50 p-3 rounded border border-line/60">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted font-medium">Detection Ratio</span>
                                  <span className="font-bold font-mono text-base text-text">
                                    <span className={enrichData.virustotal.malicious > 0 ? "text-danger" : "text-confirmed"}>
                                      {enrichData.virustotal.malicious}
                                    </span>
                                    <span className="text-muted"> / {enrichData.virustotal.totalVendors || 92} vendors</span>
                                  </span>
                                </div>

                                {/* Segmented Bar */}
                                <div className="w-full h-2 rounded-full bg-panel overflow-hidden border border-line/40 flex">
                                  <div
                                    className="h-full bg-danger"
                                    style={{
                                      width: `${((enrichData.virustotal.malicious || 0) / (enrichData.virustotal.totalVendors || 90)) * 100}%`,
                                    }}
                                  />
                                  <div
                                    className="h-full bg-amber-500"
                                    style={{
                                      width: `${((enrichData.virustotal.suspicious || 0) / (enrichData.virustotal.totalVendors || 90)) * 100}%`,
                                    }}
                                  />
                                  <div
                                    className="h-full bg-confirmed"
                                    style={{
                                      width: `${((enrichData.virustotal.harmless || 0) / (enrichData.virustotal.totalVendors || 90)) * 100}%`,
                                    }}
                                  />
                                </div>

                                {/* Breakdown counts */}
                                <div className="grid grid-cols-4 gap-1 pt-1 text-center text-[10px] font-mono">
                                  <div className="p-1 rounded bg-danger/10 text-danger border border-danger/20">
                                    <div className="font-bold text-xs">{enrichData.virustotal.malicious}</div>
                                    <div className="text-[9px] uppercase">Malicious</div>
                                  </div>
                                  <div className="p-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <div className="font-bold text-xs">{enrichData.virustotal.suspicious}</div>
                                    <div className="text-[9px] uppercase">Suspicious</div>
                                  </div>
                                  <div className="p-1 rounded bg-confirmed/10 text-confirmed border border-confirmed/20">
                                    <div className="font-bold text-xs">{enrichData.virustotal.harmless}</div>
                                    <div className="text-[9px] uppercase">Harmless</div>
                                  </div>
                                  <div className="p-1 rounded bg-raised text-muted border border-line">
                                    <div className="font-bold text-xs">{enrichData.virustotal.undetected}</div>
                                    <div className="text-[9px] uppercase">Undetected</div>
                                  </div>
                                </div>
                              </div>

                              {/* Details list */}
                              <div className="text-xs space-y-2 pt-1 font-sans">
                                {enrichData.virustotal.asOwner && (
                                  <div className="flex items-center justify-between py-1 border-b border-line/30">
                                    <span className="text-muted">AS Owner</span>
                                    <span className="font-semibold text-text truncate max-w-[200px]" title={enrichData.virustotal.asOwner}>
                                      {enrichData.virustotal.asOwner}
                                    </span>
                                  </div>
                                )}

                                {enrichData.virustotal.network && (
                                  <div className="flex items-center justify-between py-1 border-b border-line/30">
                                    <span className="text-muted">Network CIDR</span>
                                    <span className="font-mono text-steel">
                                      {enrichData.virustotal.network}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between py-1 border-b border-line/30">
                                  <span className="text-muted">VT Community Reputation</span>
                                  <span className={`font-mono font-bold ${
                                    (enrichData.virustotal.reputation ?? 0) < 0 ? "text-danger" : "text-text"
                                  }`}>
                                    {enrichData.virustotal.reputation ?? 0}
                                  </span>
                                </div>

                                {enrichData.virustotal.country && (
                                  <div className="flex items-center justify-between py-1 border-b border-line/30">
                                    <span className="text-muted">Geo Country</span>
                                    <span className="font-semibold text-text">
                                      {enrichData.virustotal.country}
                                    </span>
                                  </div>
                                )}

                                {enrichData.virustotal.tags && enrichData.virustotal.tags.length > 0 && (
                                  <div className="py-1">
                                    <span className="text-muted block mb-1">Tags</span>
                                    <div className="flex flex-wrap gap-1">
                                      {enrichData.virustotal.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-raised text-steel border border-line"
                                        >
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="py-6 text-center text-xs text-muted">
                              No VirusTotal data available or lookup skipped.
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-line/50">
                          <a
                            href={`https://www.virustotal.com/gui/ip-address/${v}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-steel hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open Full VirusTotal Dossier</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* For Hash Artifacts */}
                  {["hash", "sha256", "sha1", "md5"].includes(k) && enrichData.virustotal && (
                    <div className="rounded-lg border border-line bg-surface p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-line">
                        <div className="flex items-center gap-2">
                          <FileCode className="text-steel" size={18} />
                          <h3 className="font-bold text-sm text-text">
                            VirusTotal File Analysis Engine
                          </h3>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase ${
                            enrichData.virustotal.verdict === "MALICIOUS"
                              ? "bg-danger/20 text-danger border-danger/40"
                              : enrichData.virustotal.verdict === "SUSPICIOUS"
                              ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                              : "bg-confirmed/20 text-confirmed border-confirmed/40"
                          }`}
                        >
                          {enrichData.virustotal.verdict}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 bg-raised/50 p-4 rounded border border-line">
                          <span className="text-xs text-muted block">Security Vendors Detection</span>
                          <div className="text-xl font-mono font-bold text-text">
                            <span className={enrichData.virustotal.malicious > 0 ? "text-danger" : "text-confirmed"}>
                              {enrichData.virustotal.malicious}
                            </span>
                            <span className="text-muted text-sm"> / {enrichData.virustotal.totalVendors} engines</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-mono">
                            <div className="p-1.5 rounded bg-danger/10 text-danger border border-danger/20">
                              <div className="font-bold">{enrichData.virustotal.malicious}</div>
                              <div className="text-[10px]">Malicious</div>
                            </div>
                            <div className="p-1.5 rounded bg-confirmed/10 text-confirmed border border-confirmed/20">
                              <div className="font-bold">{enrichData.virustotal.harmless}</div>
                              <div className="text-[10px]">Harmless</div>
                            </div>
                            <div className="p-1.5 rounded bg-raised text-muted border border-line">
                              <div className="font-bold">{enrichData.virustotal.undetected}</div>
                              <div className="text-[10px]">Undetected</div>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs space-y-2 bg-raised/50 p-4 rounded border border-line">
                          {enrichData.virustotal.threatLabel && (
                            <div className="pb-1 border-b border-line/40">
                              <span className="text-muted block text-[11px]">Threat Classification</span>
                              <span className="font-bold text-danger text-sm font-mono">
                                {enrichData.virustotal.threatLabel}
                              </span>
                            </div>
                          )}
                          {enrichData.virustotal.meaningfulName && (
                            <div className="pb-1 border-b border-line/40">
                              <span className="text-muted block text-[11px]">Identified Binary Name</span>
                              <span className="font-mono text-text">
                                {enrichData.virustotal.meaningfulName}
                              </span>
                            </div>
                          )}
                          {enrichData.virustotal.fileType && (
                            <div className="pb-1 border-b border-line/40">
                              <span className="text-muted block text-[11px]">File Format</span>
                              <span className="font-medium text-text">
                                {enrichData.virustotal.fileType}
                              </span>
                            </div>
                          )}
                          {enrichData.virustotal.fileSize && (
                            <div>
                              <span className="text-muted block text-[11px]">File Size</span>
                              <span className="font-mono text-muted">
                                {(enrichData.virustotal.fileSize / 1024).toFixed(1)} KB ({enrichData.virustotal.fileSize} bytes)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* For Domain Artifacts */}
                  {["domain", "c2", "url", "hostname", "fqdn"].includes(k) && enrichData.virustotal && (
                    <div className="rounded-lg border border-line bg-surface p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-line">
                        <div className="flex items-center gap-2">
                          <Globe className="text-steel" size={18} />
                          <h3 className="font-bold text-sm text-text">
                            VirusTotal Domain Intelligence
                          </h3>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase ${
                            enrichData.virustotal.verdict === "MALICIOUS"
                              ? "bg-danger/20 text-danger border-danger/40"
                              : enrichData.virustotal.verdict === "SUSPICIOUS"
                              ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                              : "bg-confirmed/20 text-confirmed border-confirmed/40"
                          }`}
                        >
                          {enrichData.virustotal.verdict}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="bg-raised/50 p-4 rounded border border-line space-y-2">
                          <span className="text-muted block">Detection Verdict</span>
                          <div className="text-xl font-mono font-bold text-text">
                            <span className={enrichData.virustotal.malicious > 0 ? "text-danger" : "text-confirmed"}>
                              {enrichData.virustotal.malicious}
                            </span>
                            <span className="text-muted text-sm"> / {enrichData.virustotal.totalVendors} vendors flagged</span>
                          </div>
                        </div>

                        <div className="bg-raised/50 p-4 rounded border border-line space-y-2">
                          {enrichData.virustotal.registrar && (
                            <div>
                              <span className="text-muted block text-[11px]">Registrar</span>
                              <span className="font-medium text-text">{enrichData.virustotal.registrar}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted block text-[11px]">Reputation Score</span>
                            <span className="font-mono text-text">{enrichData.virustotal.reputation ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* External Threat Intelligence Dossiers */}
              <div className="space-y-2.5 pt-2 border-t border-line">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                  Pivot to External Threat Platforms
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {links.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg border border-line bg-surface hover:bg-raised hover:border-steel/50 transition-colors text-xs text-text group"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Globe size={13} className="text-steel shrink-0" />
                        <span className="font-medium truncate">{link.name}</span>
                      </span>
                      <ExternalLink size={12} className="text-muted group-hover:text-steel shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-line bg-raised/40 flex items-center justify-between text-xs text-muted">
              <span>HuntFlow Automated Threat Enrichment</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary py-1.5 px-4 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
