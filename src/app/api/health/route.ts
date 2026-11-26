import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "down";
  let dbLatency = 0;
  let counts = { investigations: 0, techniques: 0, rules: 0, artifacts: 0 };

  try {
    const [invCount, techCount, ruleCount, artCount] = await Promise.all([
      db.investigation.count(),
      db.technique.count(),
      db.detectionRule.count(),
      db.artifact.count(),
    ]);
    dbStatus = "healthy";
    dbLatency = Date.now() - startTime;
    counts = {
      investigations: invCount,
      techniques: techCount,
      rules: ruleCount,
      artifacts: artCount,
    };
  } catch (err: any) {
    dbStatus = `unreachable: ${err.message}`;
    dbLatency = Date.now() - startTime;
  }

  const hasVT = Boolean(process.env.VIRUSTOTAL_API_KEY);
  const hasAbuse = Boolean(process.env.ABUSEIPDB_API_KEY);

  const status = dbStatus === "healthy" ? 200 : 503;

  return NextResponse.json(
    {
      status: dbStatus === "healthy" ? "ok" : "degraded",
      platform: "HuntFlow Threat Hunting Platform",
      developer: "Ahmed Alaa",
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          counts,
        },
        threatIntelAPIs: {
          virustotal: hasVT ? "configured" : "missing_key",
          abuseipdb: hasAbuse ? "configured" : "missing_key",
        },
      },
    },
    { status }
  );
}
