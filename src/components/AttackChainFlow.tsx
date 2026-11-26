import Link from "next/link";
import { ArrowRight, CheckCircle2, HelpCircle, GitCommitHorizontal } from "lucide-react";

type MappingWithTactics = {
  id: string;
  status: string;
  confidence: number;
  technique: {
    id: string;
    attackId: string;
    name: string;
    tactics: {
      tactic: {
        name: string;
        shortname: string;
        order: number;
      };
    }[];
  };
  evidence?: { id: string; title: string } | null;
};

export default function AttackChainFlow({ mappings }: { mappings: MappingWithTactics[] }) {
  if (!mappings.length) return null;

  // Group mappings by primary tactic in kill-chain order
  const stageMap = new Map<
    string,
    { order: number; name: string; items: MappingWithTactics[] }
  >();

  for (const m of mappings) {
    const sortedTactics = [...m.technique.tactics].sort((a, b) => a.tactic.order - b.tactic.order);
    const primary = sortedTactics[0]?.tactic ?? { name: "Other / Unclassified", shortname: "other", order: 999 };
    if (!stageMap.has(primary.shortname)) {
      stageMap.set(primary.shortname, { order: primary.order, name: primary.name, items: [] });
    }
    stageMap.get(primary.shortname)!.items.push(m);
  }

  const stages = Array.from(stageMap.values()).sort((a, b) => a.order - b.order);

  return (
    <section className="panel p-4 space-y-3 animate-slide-up">
      <div className="flex items-center justify-between border-b border-line/40 pb-2">
        <h2 className="section-title flex items-center gap-2">
          <GitCommitHorizontal size={15} className="text-steel" />
          Visual Attack Chain
        </h2>
        <span className="text-[11px] text-muted">
          {stages.length} Kill-Chain Stages · {mappings.length} Techniques
        </span>
      </div>

      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {stages.map((stage, idx) => (
          <div key={stage.name} className="flex items-center gap-2 shrink-0">
            <div className="w-52 rounded-md border border-line bg-raised/40 p-2.5 space-y-2 hover:border-steel/40 transition-colors">
              <div className="text-[10px] font-bold uppercase tracking-wider text-steel border-b border-line/40 pb-1 truncate">
                {idx + 1}. {stage.name}
              </div>
              <div className="space-y-1.5">
                {stage.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/mitre/${item.technique.id}`}
                    className="block rounded border border-line/60 bg-panel px-2 py-1.5 hover:border-steel/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold text-steel group-hover:underline">
                        {item.technique.attackId}
                      </span>
                      {item.status === "CONFIRMED" ? (
                        <CheckCircle2 size={11} className="text-confirmed shrink-0" />
                      ) : (
                        <HelpCircle size={11} className="text-suspected shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-text font-medium truncate mt-0.5">
                      {item.technique.name}
                    </div>
                    {item.evidence && (
                      <div className="text-[10px] text-muted truncate mt-0.5">
                        ↳ {item.evidence.title}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {idx < stages.length - 1 && (
              <ArrowRight size={14} className="text-muted/70 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
