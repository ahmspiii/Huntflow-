import Link from "next/link";
import { db } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Shield, Search as SearchIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Mitre({ searchParams }: any) {
  const { q = "", tactic = "", platform = "" } = searchParams;
  const [ver, tactics] = await Promise.all([
    db.attackVersion.findFirst({ orderBy: { importedAt: "desc" } }),
    db.tactic.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!ver)
    return (
      <EmptyState
        icon={Shield}
        title="No ATT&CK data imported"
        description="Run npm run mitre:import to download the enterprise matrix."
      />
    );

  const where: any = { versionId: ver.id, revoked: false, deprecated: false };
  if (q)
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { attackId: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  if (tactic) where.tactics = { some: { tacticId: tactic } };
  if (platform) where.platforms = { has: platform };
  const ts = await db.technique.findMany({ where, orderBy: { attackId: "asc" }, take: 300 });

  return (
    <div className="space-y-4">
      <PageHeader
        title="ATT&CK Explorer"
        subtitle={`MITRE Enterprise ${ver.version} · ${ts.length} techniques listed`}
        icon={Shield}
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "ATT&CK Explorer" }]}
        actions={
          <Link href="/coverage" className="btn-primary text-xs">
            <Shield size={13} /> View Coverage Matrix
          </Link>
        }
      />

      {/* Integrated Filter Toolbar */}
      <form className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <SearchIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-8 py-1.5 text-xs"
            name="q"
            defaultValue={q}
            placeholder="Search by keyword, tactic, or technique ID (e.g. T1059)..."
            aria-label="Keyword"
          />
        </div>
        <select className="input max-w-[180px] py-1.5 text-xs" name="tactic" defaultValue={tactic}>
          <option value="">All tactics</option>
          {tactics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select className="input max-w-[140px] py-1.5 text-xs" name="platform" defaultValue={platform}>
          <option value="">All platforms</option>
          {["Windows", "Linux", "macOS", "Cloud", "Containers"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button className="btn py-1.5 text-xs">Filter</button>
        {(q || tactic || platform) && (
          <Link href="/mitre" className="btn-ghost text-xs text-muted hover:text-text">
            Clear
          </Link>
        )}
      </form>

      {/* Techniques List */}
      <div>
        {ts.length ? (
          <div className="panel overflow-hidden">
            <div className="divide-y divide-line/40">
              {ts.map((t) => (
                <Link
                  key={t.id}
                  href={`/mitre/${t.id}`}
                  className={`flex items-center gap-3 py-2 px-3 text-xs hover:bg-raised/50 transition-colors group ${
                    t.isSubtechnique ? "pl-9 bg-raised/20" : ""
                  }`}
                >
                  <span className="font-mono text-steel font-semibold text-[11px] w-20 shrink-0">
                    {t.attackId}
                  </span>
                  <span className="flex-1 text-text group-hover:text-steel truncate">
                    {t.name}
                  </span>
                  {t.isSubtechnique && (
                    <span className="text-[10px] text-muted border border-line px-1.5 py-0.2 rounded shrink-0">
                      sub-technique
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={SearchIcon}
            title="No techniques match criteria"
            description="Try searching with a broader query or clearing platform/tactic filters."
          />
        )}
      </div>
    </div>
  );
}
