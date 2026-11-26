import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { saveNote } from "@/app/actions";
import PageHeader from "@/components/PageHeader";
import {
  Shield, Search, Library, ShieldCheck, ListChecks,
  FileText, Database, StickyNote, ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Technique({ params }: any) {
  const t = await db.technique.findUnique({
    where: { id: params.id },
    include: {
      tactics: { include: { tactic: true } },
      mappings: { include: { investigation: true, evidence: true } },
      queries: { include: { query: true } },
      rules: { include: { rule: true } },
      playbooks: { include: { playbook: true } },
    },
  });
  if (!t) notFound();

  const Section = ({ title, icon: Icon, children, count }: { title: string; icon: any; children: React.ReactNode; count?: number }) => (
    <section className="panel p-4">
      <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-line/40">
        <Icon size={14} className="text-steel" />
        <h2 className="section-title">{title}</h2>
        {count !== undefined && <span className="badge-steel text-[11px] ml-auto">{count}</span>}
      </div>
      {children}
    </section>
  );

  const None = ({ text, action }: { text?: string; action?: { label: string; href: string } }) => (
    <div className="text-xs text-muted py-1 flex items-center gap-3">
      <span>{text || "None linked yet."}</span>
      {action && (
        <Link href={action.href} className="text-steel hover:underline">
          {action.label} →
        </Link>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader
        title={`${t.attackId}: ${t.name}`}
        subtitle={`${t.tactics.map((x) => x.tactic.name).join(", ")} · Platforms: ${t.platforms.join(", ") || "Generic"}`}
        icon={Shield}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "ATT&CK Explorer", href: "/mitre" },
          { label: t.attackId },
        ]}
        actions={
          <a
            href={`https://attack.mitre.org/techniques/${t.attackId.replace(".", "/")}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn text-xs"
          >
            MITRE Source <ExternalLink size={12} />
          </a>
        }
      />

      {/* Tactic & Platform Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        {t.tactics.map((x) => (
          <span key={x.tacticId} className="badge-steel text-[11px]">{x.tactic.name}</span>
        ))}
        {t.platforms.map((p) => (
          <span key={p} className="badge bg-raised text-muted text-[11px] border border-line">{p}</span>
        ))}
        {t.isSubtechnique && (
          <span className="badge bg-raised text-muted text-[11px] border border-line">Sub-technique</span>
        )}
      </div>

      <Section title="Description" icon={FileText}>
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-text/90">{t.description}</p>
      </Section>

      <Section title="Detection & Log Sources" icon={Database}>
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-text/90">
          {t.detection || "No specific detection guidance recorded in this ATT&CK version."}
        </p>
        {t.dataSources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-line/40">
            {t.dataSources.map((ds) => (
              <span key={ds} className="badge bg-raised text-muted text-[11px] border border-line">{ds}</span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Investigations & Evidence" icon={Search} count={t.mappings.length}>
        {t.mappings.length ? (
          <div className="divide-y divide-line/40">
            {t.mappings.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-2 text-xs"
              >
                <div>
                  <Link href={`/investigations/${m.investigationId}`} className="text-steel font-medium hover:underline">
                    {m.investigation.title}
                  </Link>
                  <span className={`ml-2 text-[10px] ${m.status === "CONFIRMED" ? "badge-confirmed" : "badge-suspected"}`}>
                    {m.status.toLowerCase()}
                  </span>
                  {m.evidence && <span className="text-muted ml-2">· {m.evidence.title}</span>}
                </div>
                <span className="text-[11px] text-muted font-mono">{m.confidence}% conf.</span>
              </div>
            ))}
          </div>
        ) : (
          <None text="No investigations linked to this technique." action={{ label: "Start investigation", href: "/investigations/new" }} />
        )}
      </Section>

      <div className="grid md:grid-cols-3 gap-4">
        <Section title="Hunting Queries" icon={Library} count={t.queries.length}>
          {t.queries.length ? (
            <div className="space-y-1.5 text-xs">
              {t.queries.map((x) => (
                <div key={x.queryId}>
                  <Link href={`/queries/${x.queryId}`} className="text-steel hover:underline block truncate">
                    {x.query.title}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <None text="None." action={{ label: "Add query", href: "/queries/new" }} />
          )}
        </Section>

        <Section title="Detection Rules" icon={ShieldCheck} count={t.rules.length}>
          {t.rules.length ? (
            <div className="space-y-1.5 text-xs">
              {t.rules.map((x) => (
                <div key={x.ruleId}>
                  <Link href={`/detections/${x.ruleId}`} className="text-steel hover:underline block truncate">
                    {x.rule.name}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <None text="None." action={{ label: "Add rule", href: "/detections/new" }} />
          )}
        </Section>

        <Section title="Playbooks" icon={ListChecks} count={t.playbooks.length}>
          {t.playbooks.length ? (
            <div className="space-y-1.5 text-xs">
              {t.playbooks.map((x) => (
                <div key={x.playbookId}>
                  <Link href={`/playbooks/${x.playbookId}`} className="text-steel hover:underline block truncate">
                    {x.playbook.title}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <None text="None." action={{ label: "Add playbook", href: "/playbooks/new" }} />
          )}
        </Section>
      </div>

      <Section title="Analyst Notes" icon={StickyNote}>
        <form action={saveNote.bind(null, t.id)} className="space-y-2">
          <textarea
            className="input font-mono text-xs"
            rows={3}
            name="notes"
            defaultValue={t.notes}
            placeholder="Document threat hunting observations, false positives, or SIEM quirks..."
          />
          <button className="btn-primary text-xs">Save Notes</button>
        </form>
      </Section>
    </div>
  );
}
