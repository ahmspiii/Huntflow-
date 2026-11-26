import Link from "next/link";
import { db } from "@/lib/db";
import Stat from "@/components/Stat";
import TacticChart from "@/components/TacticChart";
import PageHeader from "@/components/PageHeader";
import {
  LayoutDashboard, FlaskConical, Search, Shield, Library,
  ShieldCheck, ListChecks, ArrowRight, Activity, Target, Zap,
  Bug, Hash, Radio, CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [
    inv, labsDone, rules, techs, recent, byTactic, total,
    totalLabs, totalQueries, totalPlaybooks, malwareCount, artifactCount,
    draftRules, testingRules, validatedRules,
  ] = await Promise.all([
    db.investigation.count(),
    db.lab.count({ where: { status: "COMPLETED" } }),
    db.detectionRule.count(),
    db.techniqueMapping.findMany({ distinct: ["techniqueId"], select: { techniqueId: true } }),
    db.investigation.findMany({ orderBy: { updatedAt: "desc" }, take: 6, include: { lab: true } }),
    db.tactic.findMany({
      select: {
        name: true,
        techniques: {
          select: { technique: { select: { _count: { select: { mappings: true } } } } },
        },
      },
    }),
    db.technique.count({ where: { isSubtechnique: false, revoked: false, deprecated: false } }),
    db.lab.count(),
    db.huntingQuery.count(),
    db.playbook.count(),
    db.malwareSample.count(),
    db.artifact.count(),
    db.detectionRule.count({ where: { validation: "DRAFT" } }),
    db.detectionRule.count({ where: { validation: "TESTING" } }),
    db.detectionRule.count({ where: { validation: "VALIDATED" } }),
  ]);

  const chart = byTactic
    .map((t) => ({
      name: t.name,
      count: t.techniques.reduce((s, x) => s + x.technique._count.mappings, 0),
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const totalDetections = rules || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Threat Hunting Dashboard"
        subtitle="Operational metrics, recent investigations, malware telemetry, and ATT&CK coverage tracking."
        icon={LayoutDashboard}
      />

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Active Investigations" value={inv} icon={Search} href="/investigations" />
        <Stat label="Completed Labs" value={`${labsDone} / ${totalLabs}`} icon={FlaskConical} href="/labs" />
        <Stat
          label="Techniques Tracked"
          value={`${techs.length}${total ? ` / ${total}` : ""}`}
          icon={Target}
          href="/coverage"
        />
        <Stat label="Detection Rules" value={rules} icon={ShieldCheck} href="/detections" />
      </div>

      {/* Secondary Metrics Row: Malware & IOCs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/malware"
          className="panel p-3 bg-surface hover:border-steel/50 transition-colors group"
        >
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium group-hover:text-steel">Malware Samples</span>
            <Bug size={14} className="text-danger" />
          </div>
          <div className="text-xl font-bold text-text mt-1">{malwareCount}</div>
          <div className="text-[10px] text-muted mt-0.5">Static &amp; C2 analyzed</div>
        </Link>

        <Link
          href="/iocs"
          className="panel p-3 bg-surface hover:border-steel/50 transition-colors group"
        >
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium group-hover:text-steel">Threat IOCs</span>
            <Hash size={14} className="text-steel" />
          </div>
          <div className="text-xl font-bold text-text mt-1">{artifactCount}</div>
          <div className="text-[10px] text-muted mt-0.5">Enriched artifacts</div>
        </Link>

        <Link
          href="/coverage/gaps"
          className="panel p-3 bg-surface hover:border-amber-500/50 transition-colors group"
        >
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium group-hover:text-amber-500">Coverage Gaps</span>
            <Shield size={14} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-text mt-1">Matrix Gaps</div>
          <div className="text-[10px] text-muted mt-0.5">Analyze risk priorities →</div>
        </Link>

        <div className="panel p-3 bg-surface">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium">Detection Pipeline</span>
            <CheckCircle2 size={14} className="text-confirmed" />
          </div>
          <div className="text-xs font-mono font-bold text-text mt-1 flex items-center justify-between">
            <span className="text-muted">{draftRules} Draft</span>
            <span className="text-amber-500">{testingRules} Test</span>
            <span className="text-confirmed">{validatedRules} Valid</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-raised overflow-hidden flex mt-1.5 border border-line/40">
            <div style={{ width: `${(draftRules / totalDetections) * 100}%` }} className="bg-muted" />
            <div style={{ width: `${(testingRules / totalDetections) * 100}%` }} className="bg-amber-500" />
            <div style={{ width: `${(validatedRules / totalDetections) * 100}%` }} className="bg-confirmed" />
          </div>
        </div>
      </div>

      {/* Main Analysis Panels */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Tactics Breakdown */}
        <section className="panel p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-line/40">
            <h2 className="section-title flex items-center gap-2">
              <Activity size={15} className="text-steel" />
              Most Investigated Tactics
            </h2>
            <Link href="/coverage" className="text-xs text-muted hover:text-steel transition-colors flex items-center gap-1">
              Coverage Matrix <ArrowRight size={11} />
            </Link>
          </div>
          {chart.length ? (
            <TacticChart data={chart} />
          ) : (
            <div className="py-8 text-center text-xs text-muted">
              No technique mappings yet. Link evidence to MITRE ATT&amp;CK techniques in an investigation.
            </div>
          )}
        </section>

        {/* Recent Investigations */}
        <section className="panel p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-line/40">
            <h2 className="section-title flex items-center gap-2">
              <Search size={15} className="text-steel" />
              Recent Investigations
            </h2>
            <Link href="/investigations" className="text-xs text-muted hover:text-steel transition-colors flex items-center gap-1">
              View All ({inv}) <ArrowRight size={11} />
            </Link>
          </div>
          {recent.length ? (
            <div className="divide-y divide-line/40">
              {recent.map((i) => (
                <Link
                  key={i.id}
                  className="flex items-center justify-between py-2.5 px-2 hover:bg-raised rounded transition-colors group"
                  href={`/investigations/${i.id}`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-medium text-text group-hover:text-steel truncate">
                      {i.title}
                    </div>
                    <div className="text-[11px] text-muted mt-0.5">
                      {i.lab?.name ?? "Independent Investigation"}
                    </div>
                  </div>
                  <ArrowRight size={12} className="text-muted/60 group-hover:text-steel transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted">
              No investigations created yet. Run <code className="font-mono bg-raised px-1 py-0.5 rounded text-[11px]">npm run db:seed</code> for sample data.
            </div>
          )}
        </section>
      </div>

      {/* Repository Stats Bar */}
      <div className="panel p-3 bg-raised/30 flex flex-wrap items-center justify-between gap-4 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-6">
          <span>Active Labs: <strong className="text-text font-semibold">{totalLabs}</strong></span>
          <span>Queries in Library: <strong className="text-text font-semibold">{totalQueries}</strong></span>
          <span>Playbooks: <strong className="text-text font-semibold">{totalPlaybooks}</strong></span>
          <span>Detection Rules: <strong className="text-text font-semibold">{rules}</strong></span>
          <span>Malware Samples: <strong className="text-text font-semibold">{malwareCount}</strong></span>
        </div>
        <Link href="/knowledge" className="text-steel hover:underline">
          Search entire knowledge base →
        </Link>
      </div>
    </div>
  );
}
