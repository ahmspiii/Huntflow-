import Link from "next/link";
import { db } from "@/lib/db";
import { getCoverage, COV_ORDER, COV_CLASS } from "@/lib/coverage";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Grid3x3, Download, Shield, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Coverage({ searchParams }: any) {
  const s = searchParams.s ?? "";
  const [tactics, cov] = await Promise.all([
    db.tactic.findMany({ orderBy: { order: "asc" } }),
    getCoverage(),
  ]);

  if (!cov.length)
    return (
      <EmptyState
        icon={Grid3x3}
        title="No ATT&CK data imported"
        description="Run npm run mitre:import to build the matrix."
      />
    );

  const covSummary = COV_ORDER.map((c) => ({
    status: c,
    count: cov.filter((t) => t.status === c).length,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="MITRE Coverage Matrix"
        subtitle={`${cov.length} techniques tracked across ${tactics.length} tactics · ${cov.filter((t) => t.status !== "NOT_PRACTICED").length} practiced`}
        icon={Grid3x3}
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Coverage" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/coverage/gaps" className="btn text-xs text-amber-500 border-amber-500/40 hover:bg-amber-500/10">
              <ShieldAlert size={13} /> Gap Analysis
            </Link>
            <Link href="/mitre" className="btn text-xs">
              <Shield size={13} /> ATT&CK Explorer
            </Link>
            <a className="btn-primary text-xs" href={`/coverage/export${s ? `?s=${s}` : ""}`}>
              <Download size={13} /> Export Navigator Layer (JSON)
            </a>
          </div>
        }
      />

      {/* Coverage Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {covSummary.map(({ status, count }) => (
          <Link
            key={status}
            href={s === status ? "/coverage" : `/coverage?s=${status}`}
            className={`panel p-2.5 text-center transition-colors hover:border-steel/50 ${
              s === status ? "border-steel bg-steel/10" : ""
            }`}
          >
            <div className="text-lg font-bold tabular-nums text-text">{count}</div>
            <div className="text-[11px] text-muted mt-0.5 capitalize">{status.replace(/_/g, " ").toLowerCase()}</div>
          </Link>
        ))}
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
        <span className="text-[11px] font-semibold text-muted mr-1">Filter:</span>
        <Link
          className={`px-2 py-0.5 rounded border text-xs transition-colors ${
            !s ? "border-steel bg-steel/15 text-steel font-medium" : "border-line bg-raised text-muted hover:text-text"
          }`}
          href="/coverage"
        >
          All ({cov.length})
        </Link>
        {COV_ORDER.map((c) => (
          <Link
            key={c}
            className={`px-2 py-0.5 rounded border text-xs transition-colors ${
              s === c ? "border-steel bg-steel/15 text-steel font-medium" : "border-line bg-raised text-muted hover:text-text"
            }`}
            href={`/coverage?s=${c}`}
          >
            {c.replace(/_/g, " ").toLowerCase()} ({cov.filter((t) => t.status === c).length})
          </Link>
        ))}
      </div>

      {/* Matrix Horizontal Scroll */}
      <div className="overflow-x-auto pb-4 pt-1">
        <div className="flex gap-2.5 min-w-max">
          {tactics.map((tc) => {
            const techsInTactic = cov.filter(
              (t) => t.tactics.some((x) => x.tacticId === tc.id) && (!s || t.status === s)
            );
            return (
              <div key={tc.id} className="w-44">
                <div className="mb-2 px-2 py-1.5 bg-raised/70 rounded border border-line">
                  <div className="text-[11px] font-semibold text-text truncate">{tc.name}</div>
                  <div className="text-[10px] text-muted">{techsInTactic.length} techniques</div>
                </div>
                <div className="space-y-1">
                  {techsInTactic.map((t) => (
                    <Link
                      key={t.id}
                      href={`/mitre/${t.id}`}
                      className={`block rounded px-2 py-1 text-[11px] border border-transparent hover:border-steel/50 transition-colors ${COV_CLASS[t.status]}`}
                    >
                      <span className="font-mono font-medium">{t.attackId}</span>
                      <span className="ml-1 opacity-90 truncate block">{t.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
