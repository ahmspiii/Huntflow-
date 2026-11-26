import Link from "next/link";
import { db } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import {
  BookOpen, Search as SearchIcon, Shield,
  FileText, Library, ShieldCheck, ListChecks, Hash,
} from "lucide-react";

export const dynamic = "force-dynamic";

const iconMap: Record<string, any> = {
  "Techniques": Shield,
  "Investigations": SearchIcon,
  "Evidence": FileText,
  "Artifacts (commands, event IDs, IPs)": Hash,
  "Queries": Library,
  "Detections": ShieldCheck,
  "Playbooks": ListChecks,
};

export default async function Knowledge({ searchParams }: any) {
  const q = (searchParams.q ?? "").trim();
  const c = (f: string[]) => ({ OR: f.map((x) => ({ [x]: { contains: q, mode: "insensitive" } })) });
  const r = q
    ? await Promise.all([
        db.technique.findMany({ where: { revoked: false, ...c(["name", "attackId"]) }, take: 10 }),
        db.investigation.findMany({ where: c(["title", "hypothesis", "findings"]), take: 10 }),
        db.evidence.findMany({ where: c(["title", "description", "source"]), take: 10 }),
        db.artifact.findMany({ where: c(["value", "kind"]), take: 10, include: { evidence: true } }),
        db.huntingQuery.findMany({ where: c(["title", "content", "purpose"]), take: 10 }),
        db.detectionRule.findMany({ where: c(["name", "sigma", "logSource"]), take: 10 }),
        db.playbook.findMany({ where: c(["title", "hypothesis"]), take: 10 }),
      ])
    : null;

  const groups = r
    ? ([
        ["Techniques", r[0].map((x) => [`/mitre/${x.id}`, `${x.attackId} ${x.name}`])],
        ["Investigations", r[1].map((x) => [`/investigations/${x.id}`, x.title])],
        ["Evidence", r[2].map((x) => [`/investigations/${x.investigationId}`, x.title])],
        ["Artifacts (commands, event IDs, IPs)", r[3].map((x) => [`/investigations/${x.evidence.investigationId}`, `${x.kind}: ${x.value}`])],
        ["Queries", r[4].map((x) => [`/queries/${x.id}`, x.title])],
        ["Detections", r[5].map((x) => [`/detections/${x.id}`, x.name])],
        ["Playbooks", r[6].map((x) => [`/playbooks/${x.id}`, x.title])],
      ] as [string, string[][]][])
    : [];

  const totalResults = groups.reduce((sum, g) => sum + g[1].length, 0);

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader
        title="Knowledge Base"
        subtitle="Universal search across techniques, investigations, evidence, IOCs, queries, and detections."
        icon={BookOpen}
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Knowledge Base" }]}
      />

      {/* Search Input Bar */}
      <form className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-8 py-1.5 text-xs"
            name="q"
            defaultValue={q}
            placeholder="Search across all records (e.g. LSASS, EventCode 4688, T1003, Splunk)..."
            aria-label="Search"
          />
        </div>
        <button className="btn py-1.5 text-xs">Search</button>
        {q && (
          <Link href="/knowledge" className="btn-ghost text-xs text-muted hover:text-text">
            Clear
          </Link>
        )}
      </form>

      {/* Results Section */}
      <div>
        {!q ? (
          <div className="panel p-6 text-center text-xs text-muted">
            <BookOpen size={24} className="mx-auto mb-2 text-muted/60" />
            Type any term above to perform a full-text cross-entity lookup across all Threat Hunting data.
          </div>
        ) : groups.every((g) => !g[1].length) ? (
          <EmptyState
            icon={SearchIcon}
            title={`No records matching "${q}"`}
            description="Try searching with a shorter keyword or technique ID."
          />
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-muted">
              Found <strong>{totalResults}</strong> result{totalResults !== 1 ? "s" : ""} across {groups.filter((g) => g[1].length).length} categories:
            </div>
            {groups
              .filter((g) => g[1].length)
              .map(([title, items]) => {
                const Icon = iconMap[title] || BookOpen;
                return (
                  <section key={title} className="panel overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-line/40 bg-raised/40">
                      <div className="flex items-center gap-2">
                        <Icon size={13} className="text-steel" />
                        <h2 className="text-xs font-semibold text-text">{title}</h2>
                      </div>
                      <span className="badge-steel text-[10px]">{items.length}</span>
                    </div>
                    <div className="divide-y divide-line/40">
                      {items.map(([href, label], i) => (
                        <Link
                          key={i}
                          href={href}
                          className="flex items-center justify-between px-3 py-2 text-xs hover:bg-raised/40 transition-colors group"
                        >
                          <span className="text-steel hover:underline font-mono truncate">{label}</span>
                          <span className="text-[11px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                            View →
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
