import Link from "next/link";
import { db } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import {
  ShieldAlert, Shield, AlertTriangle, ArrowRight,
  Library, Plus, ArrowLeft, Download, CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CoverageGaps({ searchParams }: any) {
  const selectedTactic = searchParams.tactic ?? "";

  const [techniques, tactics, totalRules] = await Promise.all([
    db.technique.findMany({
      where: { revoked: false, deprecated: false, isSubtechnique: false },
      select: {
        id: true,
        attackId: true,
        name: true,
        tactics: { select: { tactic: { select: { id: true, name: true, shortname: true } } } },
        mappings: {
          select: {
            id: true,
            status: true,
            investigation: { select: { id: true, title: true } },
          },
        },
        rules: { select: { rule: { select: { id: true, name: true, validation: true } } } },
        queries: { select: { query: { select: { id: true, title: true, language: true } } } },
      },
      orderBy: { attackId: "asc" },
    }),
    db.tactic.findMany({ orderBy: { order: "asc" } }),
    db.detectionRule.count(),
  ]);

  // High-impact tactics for risk weighting
  const criticalTactics = ["credential-access", "privilege-escalation", "defense-evasion", "initial-access"];
  const highTactics = ["execution", "persistence", "lateral-movement", "command-and-control"];

  // Filter only techniques that have zero detection rules
  const gaps = techniques
    .filter((t) => t.rules.length === 0)
    .map((t) => {
      const hasObservedActivity = t.mappings.length > 0;
      const isCriticalTactic = t.tactics.some((x) =>
        criticalTactics.includes(x.tactic.shortname.toLowerCase())
      );
      const isHighTactic = t.tactics.some((x) =>
        highTactics.includes(x.tactic.shortname.toLowerCase())
      );

      let severity: "CRITICAL" | "HIGH" | "MEDIUM" = "MEDIUM";
      if (hasObservedActivity || isCriticalTactic) {
        severity = "CRITICAL";
      } else if (isHighTactic) {
        severity = "HIGH";
      }

      return {
        ...t,
        severity,
        hasObservedActivity,
      };
    })
    .sort((a, b) => {
      const weight = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
      return weight[b.severity] - weight[a.severity];
    });

  const filteredGaps = selectedTactic
    ? gaps.filter((g) => g.tactics.some((x) => x.tactic.id === selectedTactic))
    : gaps;

  const criticalCount = gaps.filter((g) => g.severity === "CRITICAL").length;
  const highCount = gaps.filter((g) => g.severity === "HIGH").length;
  const actionableCount = gaps.filter((g) => g.queries.length > 0).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Detection Coverage Gap Analysis"
        subtitle="Identify unmonitored adversary techniques, prioritize by threat severity, and leverage ready hunting queries."
        icon={ShieldAlert}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Coverage", href: "/coverage" },
          { label: "Gap Analysis" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/coverage" className="btn text-xs">
              <ArrowLeft size={13} /> Back to Matrix
            </Link>
            <Link href="/detections/new" className="btn-primary text-xs">
              <Plus size={13} /> New Detection Rule
            </Link>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="panel p-3 border-danger/40 bg-danger/10">
          <div className="text-[11px] font-medium text-danger">Critical Detection Gaps</div>
          <div className="text-xl font-bold text-danger mt-1">{criticalCount}</div>
          <div className="text-[10px] text-danger/80 mt-0.5">Observed in hunts or Tier 1 tactics</div>
        </div>

        <div className="panel p-3 border-amber-500/40 bg-amber-500/10">
          <div className="text-[11px] font-medium text-amber-500">High Risk Gaps</div>
          <div className="text-xl font-bold text-amber-500 mt-1">{highCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Execution &amp; Persistence techniques</div>
        </div>

        <div className="panel p-3 border-steel/40 bg-steel/10">
          <div className="text-[11px] font-medium text-steel">Actionable from Library</div>
          <div className="text-xl font-bold text-steel mt-1">{actionableCount}</div>
          <div className="text-[10px] text-steel/80 mt-0.5">Has existing SPL/KQL queries ready</div>
        </div>

        <div className="panel p-3 bg-raised/40">
          <div className="text-[11px] font-medium text-muted">Total Active Detections</div>
          <div className="text-xl font-bold text-text mt-1">{totalRules}</div>
          <div className="text-[10px] text-muted mt-0.5">Coverage of full ATT&CK Matrix</div>
        </div>
      </div>

      {/* Tactic Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
        <span className="text-[11px] font-semibold text-muted mr-1">Filter by Tactic:</span>
        <Link
          href="/coverage/gaps"
          className={`px-2 py-0.5 rounded border text-xs transition-colors ${
            !selectedTactic ? "border-steel bg-steel/15 text-steel font-medium" : "border-line bg-raised text-muted hover:text-text"
          }`}
        >
          All Gaps ({gaps.length})
        </Link>
        {tactics.map((tc) => {
          const count = gaps.filter((g) => g.tactics.some((x) => x.tactic.id === tc.id)).length;
          if (count === 0) return null;
          return (
            <Link
              key={tc.id}
              href={`/coverage/gaps?tactic=${tc.id}`}
              className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                selectedTactic === tc.id ? "border-steel bg-steel/15 text-steel font-medium" : "border-line bg-raised text-muted hover:text-text"
              }`}
            >
              {tc.name} ({count})
            </Link>
          );
        })}
      </div>

      {/* Gaps Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-raised/40 text-muted uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-28">Severity</th>
                <th className="py-2.5 px-3 w-28">ATT&CK ID</th>
                <th className="py-2.5 px-3">Technique Name</th>
                <th className="py-2.5 px-3">Associated Tactics</th>
                <th className="py-2.5 px-3">Threat Context</th>
                <th className="py-2.5 px-3 w-56">Actionable Hunting Queries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/30">
              {filteredGaps.map((gap) => (
                <tr key={gap.id} className="hover:bg-raised/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        gap.severity === "CRITICAL"
                          ? "bg-danger/15 text-danger border-danger/30"
                          : gap.severity === "HIGH"
                          ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                          : "bg-raised text-muted border-line"
                      }`}
                    >
                      {gap.severity}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono font-semibold">
                    <Link href={`/mitre/${gap.id}`} className="text-steel hover:underline">
                      {gap.attackId}
                    </Link>
                  </td>

                  <td className="py-2.5 px-3 text-text font-medium">
                    <Link href={`/mitre/${gap.id}`} className="hover:text-steel">
                      {gap.name}
                    </Link>
                  </td>

                  <td className="py-2.5 px-3 text-muted">
                    <div className="flex flex-wrap gap-1">
                      {gap.tactics.map((x) => (
                        <span key={x.tactic.id} className="text-[10px] px-1 rounded bg-raised border border-line">
                          {x.tactic.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    {gap.hasObservedActivity ? (
                      <span className="text-[11px] text-danger font-medium flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Encountered in {gap.mappings.length} investigation(s)
                      </span>
                    ) : (
                      <span className="text-muted text-[11px]">Unobserved</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    {gap.queries.length > 0 ? (
                      <div className="space-y-1">
                        {gap.queries.map((q) => (
                          <Link
                            key={q.query.id}
                            href={`/queries/${q.query.id}`}
                            className="inline-flex items-center gap-1 text-[11px] text-steel hover:underline bg-steel/10 px-1.5 py-0.5 rounded border border-steel/20"
                            title={`Open query: ${q.query.title}`}
                          >
                            <Library size={10} />
                            <span className="max-w-[170px] truncate">{q.query.title}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted text-[11px]">No query candidates</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
