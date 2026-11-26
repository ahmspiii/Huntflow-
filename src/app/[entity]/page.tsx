import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ENT } from "@/lib/entities";
import { removeEntity } from "@/app/actions";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ConfirmButton from "@/components/ConfirmButton";
import CopyButton from "@/components/CopyButton";
import {
  FlaskConical, Search, Library, ShieldCheck, ListChecks,
  Plus, Download, FileDown, Bug, ChevronLeft, ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const iconMap: Record<string, any> = {
  labs: FlaskConical,
  investigations: Search,
  queries: Library,
  detections: ShieldCheck,
  playbooks: ListChecks,
  malware: Bug,
};

function badgeClass(col: string, val: string): string | null {
  const v = val.toUpperCase();
  if (col === "severity") {
    if (v === "CRITICAL" || v === "HIGH") return "badge-danger";
    if (v === "MEDIUM") return "badge-suspected";
    if (v === "LOW") return "badge-steel";
    return "badge-muted";
  }
  if (col === "status" || col === "validation") {
    if (v === "COMPLETED" || v === "VALIDATED") return "badge-confirmed";
    if (v === "IN_PROGRESS" || v === "TESTING") return "badge-suspected";
    return "badge-muted";
  }
  if (col === "difficulty") {
    if (v === "EXPERT") return "badge-danger";
    if (v === "ADVANCED") return "badge-suspected";
    if (v === "INTERMEDIATE") return "badge-steel";
    return "badge-confirmed";
  }
  if (col === "classification") {
    if (["RANSOMWARE", "WIPER", "BACKDOOR", "RAT"].includes(v)) return "badge-danger";
    if (["LOADER", "DROPPER", "INFOSTEALER"].includes(v)) return "badge-suspected";
    return "badge-accent";
  }
  if (col === "language") {
    return "badge-steel font-mono";
  }
  return null;
}

export default async function List({ params, searchParams }: any) {
  const e = ENT[params.entity];
  if (!e) notFound();

  const q = searchParams.q ?? "",
    f = searchParams.f ?? "";
  const where: any = {};
  if (q) where.OR = e.search.map((s) => ({ [s]: { contains: q, mode: "insensitive" } }));
  if (f && e.filter) where[e.filter.field] = f;

  // Server-side pagination
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const perPage = 20;
  const skip = (page - 1) * perPage;

  const [totalCount, rows]: [number, any[]] = await Promise.all([
    (db as any)[e.model].count({ where }),
    (db as any)[e.model].findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: perPage,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage) || 1;
  const Icon = iconMap[params.entity] || FlaskConical;

  // Build page link helper preserving filters
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (f) sp.set("f", f);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/${params.entity}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={e.title}
        subtitle={`${totalCount} ${e.title.toLowerCase()} recorded · Page ${page} of ${totalPages}`}
        icon={Icon}
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: e.title }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <a className="btn text-xs" href={`/api/export?entity=${params.entity}&format=csv`}>
              <FileDown size={13} /> CSV
            </a>
            <a className="btn text-xs" href={`/api/export?entity=${params.entity}&format=json`}>
              <Download size={13} /> JSON
            </a>
            <Link className="btn-primary text-xs" href={`/${params.entity}/new`}>
              <Plus size={13} /> New {e.title.replace(/s$/, "")}
            </Link>
          </div>
        }
      />

      {/* Integrated Search & Filter Toolbar */}
      <form className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-8 py-1.5 text-xs"
            name="q"
            defaultValue={q}
            placeholder={`Filter ${e.title.toLowerCase()} by keyword...`}
            aria-label="Search"
          />
        </div>
        {e.filter && (
          <select className="input max-w-[160px] py-1.5 text-xs" name="f" defaultValue={f}>
            <option value="">All statuses</option>
            {e.filter.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        )}
        <button className="btn py-1.5 text-xs">Filter</button>
        {(q || f) && (
          <Link href={`/${params.entity}`} className="btn-ghost text-xs text-muted hover:text-text">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div>
        {rows.length ? (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line bg-raised/40">
                    {e.cols.map((c) => (
                      <th key={c} className="py-2.5 px-3 font-semibold text-left text-muted uppercase tracking-wider text-[11px]">
                        {c}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 font-semibold text-right text-muted uppercase tracking-wider text-[11px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-raised/40 transition-colors">
                      {e.cols.map((c, i) => {
                        const rawVal = r[c];
                        const strVal = rawVal !== null && rawVal !== undefined && rawVal !== "" ? String(rawVal) : "";
                        const badge = strVal ? badgeClass(c, strVal) : null;
                        return (
                          <td key={c} className="py-2.5 px-3 max-w-xs truncate">
                            {i === 0 ? (
                              <Link
                                className="text-steel font-medium hover:underline"
                                href={`/${params.entity}/${r.id}`}
                              >
                                {strVal || "—"}
                              </Link>
                            ) : c === "sha256" && strVal ? (
                              <div className="inline-flex items-center gap-1 font-mono text-[11px] text-text/90">
                                <span className="bg-raised px-1.5 py-0.5 rounded border border-line/60">
                                  {strVal.slice(0, 14)}…
                                </span>
                                <CopyButton text={strVal} compact />
                              </div>
                            ) : badge ? (
                              <span className={badge}>{strVal}</span>
                            ) : (
                              <span className="text-muted">{strVal || "—"}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/${params.entity}/${r.id}`}
                            className="btn-ghost py-1 px-2 text-steel hover:text-steel text-[11px]"
                          >
                            Edit
                          </Link>
                          <form action={removeEntity.bind(null, params.entity, r.id, `/${params.entity}`)}>
                            <ConfirmButton
                              label="Delete"
                              variant="ghost"
                              confirmTitle={`Delete ${e.title.replace(/s$/, "")}`}
                              confirmMessage={`Are you sure you want to permanently delete this ${e.title.replace(/s$/, "").toLowerCase()} record?`}
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-line bg-raised/30 text-xs text-muted">
                <div>
                  Showing <strong className="text-text">{skip + 1}</strong> to{" "}
                  <strong className="text-text">{Math.min(skip + rows.length, totalCount)}</strong> of{" "}
                  <strong className="text-text">{totalCount}</strong> records
                </div>
                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link
                      href={pageHref(page - 1)}
                      className="btn py-1 px-2.5 text-xs inline-flex items-center gap-1"
                    >
                      <ChevronLeft size={13} /> Previous
                    </Link>
                  ) : (
                    <span className="btn py-1 px-2.5 text-xs opacity-50 cursor-not-allowed">
                      <ChevronLeft size={13} /> Previous
                    </span>
                  )}

                  <span className="text-xs font-mono px-2">
                    {page} / {totalPages}
                  </span>

                  {page < totalPages ? (
                    <Link
                      href={pageHref(page + 1)}
                      className="btn py-1 px-2.5 text-xs inline-flex items-center gap-1"
                    >
                      Next <ChevronRight size={13} />
                    </Link>
                  ) : (
                    <span className="btn py-1 px-2.5 text-xs opacity-50 cursor-not-allowed">
                      Next <ChevronRight size={13} />
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={Icon}
            title={q || f ? "No matches found" : `No ${e.title.toLowerCase()} yet`}
            description={q || f ? "Try refining your search keyword or filters." : `Add your first ${e.title.replace(/s$/, "").toLowerCase()} to get started.`}
            action={!q && !f ? { label: `New ${e.title.replace(/s$/, "")}`, href: `/${params.entity}/new` } : undefined}
          />
        )}
      </div>
    </div>
  );
}
