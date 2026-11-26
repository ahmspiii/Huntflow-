import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ReportActions from "@/components/ReportActions";
import { Shield, Calendar, Clock, Database, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvestigationReport({ params }: { params: { id: string } }) {
  const inv = await db.investigation.findUnique({
    where: { id: params.id },
    include: {
      lab: true,
      evidence: { include: { artifacts: true } },
      mappings: { include: { technique: true, evidence: true } },
      timeline: { include: { evidence: true }, orderBy: { occurredAt: "asc" } },
    },
  });

  if (!inv) notFound();

  const confirmedMappings = inv.mappings.filter((m) => m.status === "CONFIRMED");
  const suspectedMappings = inv.mappings.filter((m) => m.status === "SUSPECTED");

  // Format as clean Markdown for export
  const markdownReport = `# Executive Incident Report: ${inv.title}
**Date:** ${new Date().toLocaleDateString()}
**Lead Investigator:** Ahmed Alaa
**SIEM Platform:** ${inv.siem || "Generic"}
**Associated Lab:** ${inv.lab?.name ?? "Independent"}

---

## 1. Executive Summary
- **Hypothesis:** ${inv.hypothesis || "Not specified"}
- **Objectives:** ${inv.objectives || "Not specified"}
- **Key Findings:** ${inv.findings || "No findings documented"}
- **Conclusion:** ${inv.conclusion || "Investigation pending conclusion"}
- **Lessons Learned:** ${inv.lessons || "None documented"}

---

## 2. Attack Flow Timeline
${inv.timeline.length > 0 ? inv.timeline.map((t) => `- **${new Date(t.occurredAt).toISOString()}** [${t.source || "Unknown"}]: ${t.description}`).join("\n") : "No timeline events recorded."}

---

## 3. Evidence & Extracted Artifacts
${inv.evidence.length > 0 ? inv.evidence.map((e) => `### ${e.title} (${e.source})\n${e.description}\n**Artifacts:**\n${e.artifacts.map((a) => `- \`${a.kind}: ${a.value}\``).join("\n")}`).join("\n\n") : "No evidence recorded."}

---

## 4. Confirmed MITRE ATT&CK Techniques
${confirmedMappings.length > 0 ? confirmedMappings.map((m) => `- **${m.technique.attackId}: ${m.technique.name}** (Confidence: ${m.confidence}%)\n  - Evidence: ${m.evidence?.title ?? "None"}\n  - Rationale: ${m.rationale || "None"}`).join("\n") : "No confirmed techniques."}

---
*Report generated via HuntFlow — Lead Analyst: Ahmed Alaa*
`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-4 border-b border-line/60">
        <div>
          <span className="text-[11px] font-mono uppercase text-steel font-semibold tracking-wider">
            Threat Intelligence &amp; Incident Response
          </span>
          <h1 className="text-xl font-bold text-text mt-0.5">Executive Incident Report</h1>
        </div>
        <ReportActions investigationId={inv.id} markdownContent={markdownReport} />
      </div>

      {/* Printable Report Document Sheet */}
      <div className="panel p-6 sm:p-8 space-y-6 bg-panel text-text border border-line shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-line/60 pb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-steel/15 text-steel font-mono text-[11px] border border-steel/30">
                TLP:AMBER
              </span>
              <span className="badge bg-raised text-muted font-mono text-[11px] border border-line">
                INCIDENT CASE
              </span>
            </div>
            <h2 className="text-2xl font-bold text-text tracking-tight mt-1">{inv.title}</h2>
            <div className="text-xs text-muted mt-1.5 flex flex-wrap items-center gap-4">
              <span>Investigator: <strong className="text-steel font-semibold">Ahmed Alaa</strong></span>
              <span>SIEM Platform: <strong className="text-text">{inv.siem || "Multi-source"}</strong></span>
              <span>Lab Context: <strong className="text-text">{inv.lab?.name ?? "Independent"}</strong></span>
            </div>
          </div>
          <div className="text-right text-xs text-muted">
            <div>Report Date: <strong className="text-text">{new Date().toLocaleDateString()}</strong></div>
            <div className="text-[11px] text-muted/80 mt-1">Status: Active Documentation</div>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5 text-steel border-b border-line/40 pb-1.5">
            <FileText size={14} /> 1. Executive Summary &amp; Objectives
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-raised/30 rounded border border-line/40">
              <span className="font-semibold text-muted block mb-1">Hypothesis:</span>
              <p className="text-text/90 leading-relaxed whitespace-pre-wrap">{inv.hypothesis || "Not specified."}</p>
            </div>
            <div className="p-3 bg-raised/30 rounded border border-line/40">
              <span className="font-semibold text-muted block mb-1">Investigation Objectives:</span>
              <p className="text-text/90 leading-relaxed whitespace-pre-wrap">{inv.objectives || "Not specified."}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-1">
            <div className="p-3 bg-raised/20 rounded border border-line/40">
              <span className="font-semibold text-text block mb-1">Key Findings:</span>
              <p className="text-text/90 leading-relaxed whitespace-pre-wrap">{inv.findings || "No findings entered."}</p>
            </div>
            {inv.conclusion && (
              <div className="p-3 bg-raised/20 rounded border border-line/40">
                <span className="font-semibold text-text block mb-1">Conclusion:</span>
                <p className="text-text/90 leading-relaxed whitespace-pre-wrap">{inv.conclusion}</p>
              </div>
            )}
            {inv.lessons && (
              <div className="p-3 bg-raised/20 rounded border border-line/40">
                <span className="font-semibold text-text block mb-1">Lessons Learned &amp; Prevention:</span>
                <p className="text-text/90 leading-relaxed whitespace-pre-wrap">{inv.lessons}</p>
              </div>
            )}
          </div>
        </section>

        {/* 2. Attack Flow Timeline */}
        <section className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5 text-steel border-b border-line/40 pb-1.5">
            <Clock size={14} /> 2. Chronological Attack Timeline ({inv.timeline.length})
          </h3>
          {inv.timeline.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-raised/40">
                    <th className="py-2 px-3 font-semibold text-muted w-36">Timestamp</th>
                    <th className="py-2 px-3 font-semibold text-muted w-28">Source</th>
                    <th className="py-2 px-3 font-semibold text-muted">Observed Behavior</th>
                    <th className="py-2 px-3 font-semibold text-muted w-32">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/30">
                  {inv.timeline.map((t) => (
                    <tr key={t.id} className="hover:bg-raised/20">
                      <td className="py-2 px-3 font-mono text-[11px] text-steel whitespace-nowrap">
                        {new Date(t.occurredAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2 px-3 text-muted">{t.source || "—"}</td>
                      <td className="py-2 px-3 text-text/90 whitespace-pre-wrap">{t.description}</td>
                      <td className="py-2 px-3 text-muted">{t.evidence?.title ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted py-2">No timeline entries recorded for this case.</p>
          )}
        </section>

        {/* 3. Evidence & Artifacts */}
        <section className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5 text-steel border-b border-line/40 pb-1.5">
            <Database size={14} /> 3. Evidence &amp; Extracted Artifacts ({inv.evidence.length})
          </h3>
          {inv.evidence.length > 0 ? (
            <div className="space-y-3">
              {inv.evidence.map((ev) => (
                <div key={ev.id} className="p-3 bg-raised/20 rounded border border-line/50 text-xs">
                  <div className="flex items-center justify-between font-semibold text-text mb-1">
                    <span>{ev.title}</span>
                    <span className="text-[11px] text-muted font-normal">Source: {ev.source || "Unspecified"}</span>
                  </div>
                  {ev.description && <p className="text-muted mb-2 leading-relaxed">{ev.description}</p>}
                  {ev.artifacts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ev.artifacts.map((a) => (
                        <span key={a.id} className="font-mono text-[11px] px-2 py-0.5 rounded border border-line bg-raised text-steel">
                          {a.kind}: {a.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted py-2">No evidence items recorded.</p>
          )}
        </section>

        {/* 4. Confirmed & Suspected ATT&CK Techniques */}
        <section className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5 text-steel border-b border-line/40 pb-1.5">
            <Shield size={14} /> 4. MITRE ATT&CK Mappings ({inv.mappings.length})
          </h3>
          {inv.mappings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-raised/40">
                    <th className="py-2 px-3 font-semibold text-muted w-24">ID</th>
                    <th className="py-2 px-3 font-semibold text-muted">Technique Name</th>
                    <th className="py-2 px-3 font-semibold text-muted w-24">Status</th>
                    <th className="py-2 px-3 font-semibold text-muted w-20">Confidence</th>
                    <th className="py-2 px-3 font-semibold text-muted">Linked Evidence / Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/30">
                  {inv.mappings.map((m) => (
                    <tr key={m.id} className="hover:bg-raised/20">
                      <td className="py-2 px-3 font-mono font-semibold text-steel">{m.technique.attackId}</td>
                      <td className="py-2 px-3 text-text font-medium">{m.technique.name}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.status === "CONFIRMED" ? "badge-confirmed" : "badge-suspected"}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-muted">{m.confidence}%</td>
                      <td className="py-2 px-3 text-muted">
                        {m.evidence?.title ? <span className="text-text">{m.evidence.title} — </span> : ""}
                        {m.rationale || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted py-2">No techniques mapped to this investigation.</p>
          )}
        </section>

        {/* 5. Queries Executed */}
        {inv.queriesRun && (
          <section className="space-y-2 pt-2">
            <h3 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5 text-steel border-b border-line/40 pb-1.5">
              5. Hunting Queries Run
            </h3>
            <pre className="p-3 bg-ink rounded border border-line font-mono text-xs overflow-x-auto text-text/90">
              {inv.queriesRun}
            </pre>
          </section>
        )}

        {/* Sign-off */}
        <div className="pt-6 border-t border-line/60 flex items-center justify-between text-xs text-muted">
          <div>
            <span>Verified &amp; Certified by Lead Threat Hunter:</span>
            <div className="font-bold text-text mt-0.5">Ahmed Alaa</div>
          </div>
          <div className="text-right">
            <span>HuntFlow Incident Documentation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
