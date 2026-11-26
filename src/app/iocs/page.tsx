import Link from "next/link";
import { db } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ArtifactBadge from "@/components/ArtifactBadge";
import {
  Hash, Search, ShieldAlert, Download, ExternalLink,
  Layers, Radio, AlertTriangle, Filter, ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IOCRepository({ searchParams }: any) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const selectedKind = (searchParams.kind ?? "").trim().toLowerCase();

  // Fetch all artifacts with their parent evidence & investigation
  const artifacts = await db.artifact.findMany({
    include: {
      evidence: {
        include: {
          investigation: {
            select: { id: true, title: true },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });

  // Group by unique `kind:value` to detect cross-investigation campaigns
  const iocMap = new Map<
    string,
    {
      kind: string;
      value: string;
      investigations: { id: string; title: string; evidenceTitle: string }[];
    }
  >();

  for (const art of artifacts) {
    const key = `${art.kind.toLowerCase()}:${art.value.trim().toLowerCase()}`;
    const inv = art.evidence?.investigation;
    if (!iocMap.has(key)) {
      iocMap.set(key, {
        kind: art.kind,
        value: art.value,
        investigations: [],
      });
    }

    const entry = iocMap.get(key)!;
    if (inv && !entry.investigations.some((i) => i.id === inv.id)) {
      entry.investigations.push({
        id: inv.id,
        title: inv.title,
        evidenceTitle: art.evidence.title,
      });
    }
  }

  const allIOCs = Array.from(iocMap.values());

  // Filter based on query and kind
  const filteredIOCs = allIOCs.filter((item) => {
    const matchesQuery = !q || item.value.toLowerCase().includes(q) || item.kind.toLowerCase().includes(q);
    const matchesKind = !selectedKind || item.kind.toLowerCase() === selectedKind;
    return matchesQuery && matchesKind;
  });

  // Calculate statistics
  const totalUnique = allIOCs.length;
  const correlatedCount = allIOCs.filter((i) => i.investigations.length > 1).length;
  const ipCount = allIOCs.filter((i) => ["ip", "ipv4", "src_ip", "dest_ip", "c2_ip"].includes(i.kind.toLowerCase())).length;
  const hashCount = allIOCs.filter((i) => ["hash", "sha256", "sha1", "md5"].includes(i.kind.toLowerCase())).length;
  const domainCount = allIOCs.filter((i) => ["domain", "c2", "url", "hostname"].includes(i.kind.toLowerCase())).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Global IOC & Artifact Repository"
        subtitle="Universal intelligence inventory across all hunts, campaign correlation, and live threat telemetry."
        icon={Hash}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "IOC Repository" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/export?entity=artifacts&format=json"
              className="btn text-xs"
            >
              <Download size={13} /> Export IOCs (JSON)
            </a>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="panel p-3 bg-surface">
          <div className="text-[11px] font-medium text-muted">Unique Threat IOCs</div>
          <div className="text-xl font-bold text-text mt-1">{totalUnique}</div>
          <div className="text-[10px] text-muted mt-0.5">Cataloged in active evidence</div>
        </div>

        <div className="panel p-3 border-danger/40 bg-danger/10">
          <div className="text-[11px] font-medium text-danger">Campaign Correlations</div>
          <div className="text-xl font-bold text-danger mt-1">{correlatedCount}</div>
          <div className="text-[10px] text-danger/80 mt-0.5">IOCs shared across &gt;1 hunt</div>
        </div>

        <div className="panel p-3 bg-raised/40">
          <div className="text-[11px] font-medium text-steel">Network Entities</div>
          <div className="text-xl font-bold text-text mt-1">{ipCount + domainCount}</div>
          <div className="text-[10px] text-muted mt-0.5">{ipCount} IPs · {domainCount} Domains</div>
        </div>

        <div className="panel p-3 bg-raised/40">
          <div className="text-[11px] font-medium text-confirmed">Cryptographic Hashes</div>
          <div className="text-xl font-bold text-text mt-1">{hashCount}</div>
          <div className="text-[10px] text-muted mt-0.5">MD5, SHA-1, SHA-256</div>
        </div>
      </div>

      {/* Search and Filters */}
      <form className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-8 py-1.5 text-xs"
            name="q"
            defaultValue={q}
            placeholder="Search IOC value, hash, IP address, or kind..."
            aria-label="Search IOCs"
          />
        </div>

        <select className="input max-w-[160px] py-1.5 text-xs" name="kind" defaultValue={selectedKind}>
          <option value="">All Types</option>
          <option value="ip">IP Addresses</option>
          <option value="hash">File Hashes</option>
          <option value="sha256">SHA-256</option>
          <option value="domain">Domains / URLs</option>
          <option value="event_id">Windows Event IDs</option>
        </select>

        <button className="btn py-1.5 text-xs">Filter</button>
        {(q || selectedKind) && (
          <Link href="/iocs" className="btn-ghost text-xs text-muted hover:text-text">
            Clear
          </Link>
        )}
      </form>

      {/* IOCs Table */}
      <div>
        {filteredIOCs.length ? (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-raised/40 text-muted uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 w-28">Type</th>
                    <th className="py-2.5 px-3">Indicator of Compromise (Click for Live Dossier)</th>
                    <th className="py-2.5 px-3 w-40">Campaign Status</th>
                    <th className="py-2.5 px-3">Observed In Investigations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/30">
                  {filteredIOCs.map((item) => (
                    <tr key={`${item.kind}:${item.value}`} className="hover:bg-raised/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold uppercase text-steel text-[11px]">
                        {item.kind}
                      </td>

                      <td className="py-2.5 px-3">
                        <ArtifactBadge kind={item.kind} value={item.value} />
                      </td>

                      <td className="py-2.5 px-3">
                        {item.investigations.length > 1 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-danger/15 text-danger border border-danger/30">
                            <AlertTriangle size={11} />
                            CROSS-CASE ({item.investigations.length})
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted">Single hunt</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {item.investigations.map((inv) => (
                            <Link
                              key={inv.id}
                              href={`/investigations/${inv.id}`}
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-raised border border-line text-text hover:text-steel hover:border-steel/50 transition-colors"
                            >
                              <span className="max-w-[200px] truncate">{inv.title}</span>
                              <ArrowRight size={10} className="text-muted" />
                            </Link>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Hash}
            title={q || selectedKind ? "No IOCs match your search" : "No IOCs cataloged yet"}
            description={
              q || selectedKind
                ? "Try clearing filters or searching for a different value."
                : "Add evidence with artifacts to investigations or malware samples to populate the repository."
            }
          />
        )}
      </div>
    </div>
  );
}
