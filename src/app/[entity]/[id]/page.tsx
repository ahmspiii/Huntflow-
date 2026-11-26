import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ENT } from "@/lib/entities";
import { saveEntity, removeEntity, addEvidence, delEvidence, addMapping, delMapping, addRuleTestLog, delRuleTestLog } from "@/app/actions";
import PageHeader from "@/components/PageHeader";
import ArtifactBadge from "@/components/ArtifactBadge";
import InvestigationTimeline from "@/components/InvestigationTimeline";
import InvestigationTabs from "@/components/InvestigationTabs";
import CodeBlock from "@/components/CodeBlock";
import SigmaConverter from "@/components/SigmaConverter";
import ConfirmButton from "@/components/ConfirmButton";
import MarkdownArea from "@/components/MarkdownArea";
import AttackChainFlow from "@/components/AttackChainFlow";
import {
  FlaskConical, Search, Library, ShieldCheck, ListChecks,
  ArrowLeft, Save, Trash2, Plus, AlertTriangle, Shield, FileText,
  Clock, Database, Tag, ExternalLink, Bug,
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

export default async function Edit({ params, searchParams }: any) {
  const { entity: key, id } = params;
  const e = ENT[key];
  if (!e) notFound();

  const D = (m: string) => (db as any)[m];
  const rec: any = id === "new" ? {} : await D(e.model).findUnique({ where: { id } });
  if (!rec) notFound();

  const labs = e.fields.some((f) => f.type === "ref" && f.name === "labId")
    ? await db.lab.findMany({ select: { id: true, name: true } })
    : [];
  const investigationsList = e.fields.some((f) => f.type === "ref" && f.name === "investigationId")
    ? await db.investigation.findMany({ select: { id: true, title: true }, orderBy: { createdAt: "desc" } })
    : [];
  const ruleTestLogs =
    key === "detections" && id !== "new"
      ? await db.ruleTestLog.findMany({ where: { ruleId: id }, orderBy: { testedAt: "desc" } })
      : [];
  
  const techs =
    e.join && id !== "new"
      ? (await D(e.join.model).findMany({ where: { [e.join.fk]: id }, include: { technique: true } }))
          .map((r: any) => r.technique.attackId)
          .join(", ")
      : "";

  const inv =
    key === "investigations" && id !== "new"
      ? await db.investigation.findUnique({
          where: { id },
          include: {
            lab: { select: { id: true, name: true, source: true, siem: true } },
            evidence: { include: { artifacts: true } },
            mappings: {
              include: {
                technique: { include: { tactics: { include: { tactic: true } } } },
                evidence: true,
              },
            },
            timeline: { include: { evidence: true }, orderBy: { occurredAt: "asc" } },
            samples: { select: { id: true, name: true, family: true, classification: true } },
          },
        })
      : null;

  // If this is a Lab page, fetch its associated investigations
  const labInvestigations =
    key === "labs" && id !== "new"
      ? await db.investigation.findMany({
          where: { labId: id },
          include: {
            evidence: { include: { artifacts: true } },
            mappings: { include: { technique: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const val = (f: any) => {
    if (f.name === "labId" && id === "new" && searchParams?.labId) {
      return searchParams.labId;
    }
    return f.type === "tags"
      ? (rec[f.name] ?? []).join(", ")
      : f.type === "lines"
      ? (rec[f.name] ?? []).map((s: any) => s.title).join("\n")
      : f.type === "json"
      ? JSON.stringify(rec[f.name] ?? {})
      : rec[f.name] ?? "";
  };

  const Icon = iconMap[key] || FlaskConical;

  // Calculate totals for investigation
  const totalArtifactsCount = inv?.evidence.reduce((acc, ev) => acc + ev.artifacts.length, 0) ?? 0;
  const confirmedTechCount = inv?.mappings.filter((m) => m.status === "CONFIRMED").length ?? 0;

  return (
    <div className="space-y-4 max-w-4xl">
      <PageHeader
        title={id === "new" ? `New ${e.title.replace(/s$/, "")}` : rec[e.nameField]}
        subtitle={
          id === "new"
            ? `Define properties for this ${e.title.replace(/s$/, "").toLowerCase()}`
            : `Edit and update ${e.title.replace(/s$/, "").toLowerCase()}`
        }
        icon={Icon}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: e.title, href: `/${key}` },
          { label: id === "new" ? "New" : rec[e.nameField] },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {key === "investigations" && id !== "new" && (
              <Link className="btn-primary text-xs" href={`/investigations/${id}/report`}>
                <FileText size={13} /> Generate Incident Report
              </Link>
            )}
            {key === "malware" && id !== "new" && (
              <Link className="btn-primary text-xs" href={`/malware/${id}/report`}>
                <FileText size={13} /> Malware Analysis Report
              </Link>
            )}
            <Link className="btn text-xs" href={`/${key}`}>
              <ArrowLeft size={13} /> Back to {e.title}
            </Link>
            {id !== "new" && (
              <form action={removeEntity.bind(null, key, id)}>
                <ConfirmButton
                  label={`Delete ${e.title.replace(/s$/, "")}`}
                  confirmTitle={`Delete ${e.title.replace(/s$/, "")}`}
                  confirmMessage={`Are you sure you want to permanently delete this ${e.title.replace(/s$/, "").toLowerCase()} record?`}
                />
              </form>
            )}
          </div>
        }
      />

      {searchParams?.error && (
        <div className="panel border-danger/60 bg-danger/10 p-3 flex items-start gap-2.5 text-xs">
          <AlertTriangle size={15} className="text-danger shrink-0 mt-0.5" />
          <div>
            <strong className="text-danger">Submission Error:</strong>
            <span className="text-text/90 ml-1.5">{searchParams.error}</span>
          </div>
        </div>
      )}

      {/* SPECIALIZED WORKSPACE FOR INVESTIGATIONS */}
      {key === "investigations" && inv ? (
        <div className="space-y-4">
          {/* Quick Context & Relationship Header */}
          <div className="panel p-4 bg-surface flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold">
                  Parent Environment / Lab
                </span>
                {inv.lab ? (
                  <Link
                    href={`/labs/${inv.lab.id}`}
                    className="text-steel font-semibold hover:underline inline-flex items-center gap-1.5 text-sm"
                  >
                    <FlaskConical size={14} />
                    <span>{inv.lab.name}</span>
                    <span className="text-[10px] text-muted">({inv.lab.source})</span>
                  </Link>
                ) : (
                  <span className="text-muted font-medium">Independent (No lab linked)</span>
                )}
              </div>

              <div className="h-7 w-px bg-line/60 hidden sm:block" />

              <div>
                <span className="text-muted block text-[10px] uppercase tracking-wider font-semibold">
                  Target SIEM
                </span>
                <span className="font-semibold text-text text-sm">
                  {inv.siem || inv.lab?.siem || "Generic SIEM"}
                </span>
              </div>
            </div>

            {/* Quick Metrics Pills */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded bg-raised border border-line text-text">
                <strong className="text-steel">{inv.evidence.length}</strong> Evidence
              </span>
              <span className="px-2.5 py-1 rounded bg-raised border border-line text-text">
                <strong className="text-steel">{totalArtifactsCount}</strong> IOCs
              </span>
              <span className="px-2.5 py-1 rounded bg-raised border border-line text-text">
                <strong className="text-confirmed">{confirmedTechCount}</strong> Confirmed MITRE
              </span>
            </div>
          </div>

          {/* Visual Kill-Chain Attack Flow */}
          {inv.mappings.length > 0 && <AttackChainFlow mappings={inv.mappings} />}

          {/* Linked Malware Samples if any */}
          {inv.samples.length > 0 && (
            <section className="panel p-4 space-y-2.5 animate-slide-up">
              <div className="flex items-center justify-between border-b border-line/40 pb-2">
                <h2 className="section-title flex items-center gap-2">
                  <Bug size={15} className="text-danger" />
                  Linked Malware Specimens
                </h2>
                <span className="text-xs text-muted">{inv.samples.length} sample(s)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {inv.samples.map((s) => (
                  <Link
                    key={s.id}
                    href={`/malware/${s.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-line bg-raised/50 hover:border-steel/50 text-xs transition-colors"
                  >
                    <Bug size={12} className="text-danger" />
                    <span className="font-semibold text-text">{s.name}</span>
                    {s.family && <span className="text-muted">({s.family})</span>}
                    <span className="badge-danger text-[10px] uppercase">{s.classification}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Investigation Tabs: Evidence is FIRST and readily accessible! */}
          <InvestigationTabs
            evidenceCount={inv.evidence.length}
            timelineCount={inv.timeline.length}
            mappingsCount={inv.mappings.length}
            totalArtifactsCount={totalArtifactsCount}
            /* TAB 1: EVIDENCE & ARTIFACTS (IOCs) */
            evidenceContent={
              <div className="space-y-4">
                <section className="panel p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-line/40 pb-2.5">
                    <div>
                      <h2 className="section-title">
                        Evidence &amp; Artifacts Repository
                        <span className="badge-steel text-[11px] ml-2">{inv.evidence.length}</span>
                      </h2>
                      <p className="text-xs text-muted mt-0.5">
                        Log sources, network captures, artifacts, and live threat intelligence enrichment.
                      </p>
                    </div>
                  </div>

                  {inv.evidence.length ? (
                    <div className="divide-y divide-line/40">
                      {inv.evidence.map((ev) => (
                        <div key={ev.id} className="py-3.5 first:pt-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-text">{ev.title}</div>
                              {ev.source && (
                                <div className="text-[11px] text-muted font-mono mt-0.5">
                                  Source: <strong className="text-steel">{ev.source}</strong>
                                </div>
                              )}
                            </div>
                            <form action={delEvidence.bind(null, id, ev.id)}>
                              <ConfirmButton
                                label="Remove"
                                confirmTitle="Remove Evidence"
                                confirmMessage="Are you sure you want to remove this evidence? Any confirmed technique mappings linked to it will revert to suspected status."
                                variant="ghost"
                              />
                            </form>
                          </div>

                          {ev.description && (
                            <p className="text-xs text-text/80 mt-1.5 leading-relaxed">{ev.description}</p>
                          )}

                          {ev.artifacts.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-line/30">
                              <span className="text-[10px] uppercase tracking-wider text-muted font-semibold block mb-1.5">
                                Extracted IOCs &amp; Artifacts (Click for live VirusTotal &amp; AbuseIPDB intel):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {ev.artifacts.map((a) => (
                                  <ArtifactBadge key={a.id} kind={a.kind} value={a.value} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-muted">
                      No evidence records logged yet. Add your first evidence below.
                    </div>
                  )}

                  <div className="divider" />

                  {/* Add New Evidence Form */}
                  <form action={addEvidence.bind(null, id)} className="space-y-3 bg-raised/30 p-4 rounded-lg border border-line">
                    <span className="text-xs font-bold text-text block">Add New Evidence &amp; Artifacts</span>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <input className="input" name="title" placeholder="Evidence title (e.g. Sysmon EID 10 on WKS-04) *" required />
                      <input className="input" name="source" placeholder="Log source (e.g. Sysmon, EDR, Firewall)" />
                    </div>
                    <textarea
                      className="input"
                      name="description"
                      rows={2}
                      placeholder="Observations and context (e.g. rundll32.exe accessed lsass.exe with PROCESS_ALL_ACCESS)..."
                    />
                    <div>
                      <span className="text-[11px] text-muted font-medium mb-1 block">
                        Artifacts &amp; IOCs (one per line, <code className="text-steel">kind:value</code>):
                      </span>
                      <textarea
                        className="input font-mono text-xs"
                        name="artifacts"
                        rows={3}
                        placeholder={"ip:185.220.101.5\nhash:44d88612fea8a8f36de82e1278abb02f\nevent_id:4688\ndomain:malicious-c2.org"}
                      />
                    </div>
                    <button className="btn-primary text-xs">
                      <Plus size={13} /> Add Evidence Record
                    </button>
                  </form>
                </section>
              </div>
            }
            /* TAB 2: HYPOTHESIS & SCOPE (Form) */
            overviewContent={
              <form action={saveEntity.bind(null, key, id)} className="panel p-5 space-y-4">
                <div className="border-b border-line/40 pb-2">
                  <h2 className="section-title">Investigation Hypothesis &amp; Notes</h2>
                  <p className="text-xs text-muted mt-0.5">
                    Define the core hypothesis, executed SIEM queries, findings, and conclusion.
                  </p>
                </div>

                <div className="space-y-3">
                  {e.fields.map((f) => (
                    <label key={f.name} className="block">
                      <span className="text-xs font-medium text-muted mb-1 block">
                        {f.label}
                        {f.required && <span className="text-danger ml-0.5">*</span>}
                      </span>
                      {f.type === "select" ? (
                        <select className="input" name={f.name} defaultValue={val(f) || f.options![0]}>
                          {f.options!.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : f.type === "ref" ? (
                        <select className="input" name={f.name} defaultValue={val(f)}>
                          <option value="">None (Independent)</option>
                          {labs.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      ) : ["area", "code", "lines", "json"].includes(f.type ?? "") ? (
                        <div className="space-y-1.5">
                          <textarea
                            className={`input ${f.type === "code" ? "font-mono text-xs" : ""}`}
                            rows={f.type === "code" ? 6 : 3}
                            name={f.name}
                            defaultValue={val(f)}
                          />
                          {f.type === "code" && rec[f.name] && (
                            <div className="pt-1">
                              <CodeBlock
                                code={rec[f.name]}
                                language={rec.siem || "Code"}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <input className="input" name={f.name} defaultValue={val(f)} />
                      )}
                    </label>
                  ))}
                </div>

                {e.join && (
                  <label className="block pt-1">
                    <span className="text-xs font-medium text-muted mb-1 block">
                      Associated MITRE ATT&amp;CK Techniques (IDs, comma-separated)
                    </span>
                    <input
                      className="input font-mono"
                      name="techniques"
                      defaultValue={techs}
                      placeholder="e.g. T1003.001, T1059.001"
                    />
                  </label>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-line/40">
                  <button className="btn-primary text-xs">
                    <Save size={13} /> Save Investigation Details
                  </button>
                </div>
              </form>
            }
            /* TAB 3: ATTACK TIMELINE */
            timelineContent={
              <InvestigationTimeline
                investigationId={id}
                events={inv.timeline}
                evidenceList={inv.evidence.map((ev) => ({ id: ev.id, title: ev.title }))}
              />
            }
            /* TAB 4: MITRE ATT&CK MAPPINGS */
            mappingsContent={
              <section className="panel p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-line/40 pb-2">
                  <div>
                    <h2 className="section-title">
                      ATT&amp;CK Technique Mappings
                      <span className="badge-steel text-[11px] ml-2">{inv.mappings.length}</span>
                    </h2>
                    <p className="text-xs text-muted mt-0.5">
                      Techniques mapped to this investigation with evidentiary backing.
                    </p>
                  </div>
                </div>

                {inv.mappings.length ? (
                  <div className="divide-y divide-line/40">
                    {inv.mappings.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-2.5 text-xs">
                        <div>
                          <Link className="font-mono text-steel font-semibold hover:underline" href={`/mitre/${m.techniqueId}`}>
                            {m.technique.attackId}
                          </Link>
                          <span className="ml-1.5 text-text font-medium">{m.technique.name}</span>
                          <span className={`ml-2 text-[10px] ${m.status === "CONFIRMED" ? "badge-confirmed" : "badge-suspected"}`}>
                            {m.status.toLowerCase()}
                          </span>
                          <div className="text-[11px] text-muted mt-0.5">
                            {m.evidence?.title ? `Evidence: ${m.evidence.title}` : "No evidence linked"} · confidence {m.confidence}%
                          </div>
                          {m.rationale && (
                            <div className="text-[11px] text-text/80 mt-1 italic">&ldquo;{m.rationale}&rdquo;</div>
                          )}
                        </div>
                        <form action={delMapping.bind(null, id, m.id)}>
                          <button className="btn-ghost py-0.5 px-1.5 text-danger hover:text-danger text-[11px]">
                            Remove
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted py-2">No technique mappings created.</p>
                )}

                <div className="divider" />

                <form action={addMapping.bind(null, id)} className="space-y-2.5 bg-raised/30 p-4 rounded-lg border border-line">
                  <span className="text-xs font-bold text-text block">Map ATT&amp;CK Technique</span>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <input className="input font-mono sm:col-span-1" name="attackId" placeholder="e.g. T1003.001" required />
                    <select className="input sm:col-span-1" name="status">
                      <option value="SUSPECTED">Suspected</option>
                      <option value="CONFIRMED">Confirmed</option>
                    </select>
                    <select className="input sm:col-span-1" name="evidenceId">
                      <option value="">No evidence linked</option>
                      {inv.evidence.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                    <input className="input sm:col-span-1" name="confidence" type="number" min={0} max={100} defaultValue={75} />
                    <input className="input sm:col-span-4" name="rationale" placeholder="Rationale / justification for mapping..." />
                  </div>
                  <button className="btn-primary text-xs">
                    <Plus size={13} /> Add Technique Mapping
                  </button>
                </form>
              </section>
            }
          />

          {/* Delete Investigation */}
          <div className="flex justify-end pt-2">
            <form action={removeEntity.bind(null, key, id)}>
              <ConfirmButton
                label="Delete Investigation"
                confirmTitle="Delete Investigation"
                confirmMessage="Are you sure you want to permanently delete this investigation, its evidence records, and attack flow timeline?"
              />
            </form>
          </div>
        </div>
      ) : (
        /* STANDARD VIEW FOR OTHER ENTITIES (OR NEW INVESTIGATION) */
        <div className="space-y-4">
          {/* Main Details Form */}
          <form action={saveEntity.bind(null, key, id)} className="panel p-4 space-y-4">
            <div className="border-b border-line/40 pb-2">
              <h2 className="section-title">Configuration &amp; Content</h2>
            </div>

            <div className="space-y-3">
              {e.fields.map((f) => (
                <label key={f.name} className="block">
                  <span className="text-xs font-medium text-muted mb-1 block">
                    {f.label}
                    {f.required && <span className="text-danger ml-0.5">*</span>}
                  </span>
                  {f.type === "select" ? (
                    <select className="input" name={f.name} defaultValue={val(f) || f.options![0]}>
                      {f.options!.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : f.type === "ref" ? (
                    <select className="input" name={f.name} defaultValue={val(f)}>
                      <option value="">None (Independent)</option>
                      {f.name === "investigationId"
                        ? investigationsList.map((i) => (
                            <option key={i.id} value={i.id}>{i.title}</option>
                          ))
                        : labs.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                    </select>
                  ) : f.type === "area" ? (
                    <MarkdownArea name={f.name} defaultValue={val(f)} rows={4} />
                  ) : ["code", "lines", "json"].includes(f.type ?? "") ? (
                    <div className="space-y-1.5">
                      <textarea
                        className={`input ${f.type === "code" ? "font-mono text-xs" : ""}`}
                        rows={f.type === "code" ? 7 : 3}
                        name={f.name}
                        defaultValue={val(f)}
                      />
                      {f.type === "code" && rec[f.name] && (
                        <div className="pt-1">
                          <CodeBlock
                            code={rec[f.name]}
                            language={f.name === "sigma" ? "Sigma YAML" : rec.language || "Code"}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <input className="input" name={f.name} defaultValue={val(f)} />
                  )}
                </label>
              ))}
            </div>

            {e.join && (
              <label className="block pt-1">
                <span className="text-xs font-medium text-muted mb-1 block">
                  Associated MITRE ATT&amp;CK Techniques (IDs, comma-separated)
                </span>
                <input
                  className="input font-mono"
                  name="techniques"
                  defaultValue={techs}
                  placeholder="e.g. T1003.001, T1059.001"
                />
              </label>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-line/40">
              <button className="btn-primary text-xs">
                <Save size={13} /> Save Record
              </button>
            </div>
          </form>

          {/* Sigma to SIEM Converter for Detection Rules */}
          {key === "detections" && rec.sigma && (
            <SigmaConverter sigmaYaml={rec.sigma} />
          )}

          {/* YARA Rule Display for Detection Rules */}
          {key === "detections" && rec.yara && (
            <section className="panel p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-line/40">
                <h3 className="section-title flex items-center gap-2">
                  <ShieldCheck size={15} className="text-steel" />
                  YARA File &amp; Memory Detection Rule
                </h3>
              </div>
              <CodeBlock code={rec.yara} language="YARA" />
            </section>
          )}

          {/* Detection Rule Validation & Testing Log */}
          {key === "detections" && id !== "new" && (
            <section className="panel p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-line/40 pb-2">
                <div>
                  <h3 className="section-title flex items-center gap-2">
                    <Clock size={15} className="text-steel" />
                    Rule Validation &amp; Test History
                    <span className="badge-steel text-[11px]">{ruleTestLogs.length}</span>
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Track atomic test runs, SIEM replay outcomes, and false positive checks.
                  </p>
                </div>
              </div>

              {ruleTestLogs.length > 0 ? (
                <div className="divide-y divide-line/40">
                  {ruleTestLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              log.result === "PASS"
                                ? "badge-confirmed"
                                : log.result === "FALSE_POSITIVE"
                                ? "badge-suspected"
                                : "badge-danger"
                            }
                          >
                            {log.result}
                          </span>
                          <span className="font-semibold text-text">{log.environment}</span>
                          <span className="text-[11px] text-muted">
                            · {new Date(log.testedAt).toLocaleString()} · by {log.testedBy}
                          </span>
                        </div>
                        {log.notes && <p className="text-muted text-[11px]">{log.notes}</p>}
                      </div>
                      <form action={delRuleTestLog.bind(null, id, log.id)}>
                        <button className="btn-ghost py-0.5 px-1.5 text-danger hover:text-danger text-[11px]">
                          Remove
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted py-2">No validation test runs recorded for this rule yet.</p>
              )}

              <form action={addRuleTestLog.bind(null, id)} className="space-y-2.5 bg-raised/30 p-3.5 rounded-lg border border-line">
                <span className="text-xs font-bold text-text block">Log New Rule Test</span>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    className="input sm:col-span-1"
                    name="environment"
                    placeholder="Environment (e.g. Splunk Lab, Atomic T1003)"
                    required
                  />
                  <select className="input sm:col-span-1" name="result" defaultValue="PASS">
                    <option value="PASS">PASS (True Positive Fired)</option>
                    <option value="FALSE_POSITIVE">FALSE_POSITIVE (Needs Tuning)</option>
                    <option value="FAILED">FAILED (Missed Detection)</option>
                  </select>
                  <input
                    className="input sm:col-span-1"
                    name="notes"
                    placeholder="Test notes or tuning remarks..."
                  />
                </div>
                <button className="btn-primary text-xs">
                  <Plus size={13} /> Record Test Result
                </button>
              </form>
            </section>
          )}

          {/* MALWARE SAMPLE SPECIALIZED DOSSIER & VIRUSTOTAL PANEL */}
          {key === "malware" && id !== "new" && (
            <section className="panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-line/40 pb-2.5">
                <div>
                  <h2 className="section-title flex items-center gap-2">
                    <Bug size={16} className="text-steel" />
                    Threat Intel &amp; Cryptographic Hash Verification
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Live VirusTotal detection telemetry, hash lookups, and extracted infrastructure.
                  </p>
                </div>
                {rec.classification && (
                  <span className="badge-danger text-xs uppercase font-mono font-bold">
                    {rec.classification}
                  </span>
                )}
              </div>

              {/* Hashes Row */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                  File Hashes &amp; Live Detection Telemetry (Click badge for VirusTotal scan)
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {rec.sha256 && <ArtifactBadge kind="sha256" value={rec.sha256} />}
                  {rec.sha1 && <ArtifactBadge kind="sha1" value={rec.sha1} />}
                  {rec.md5 && <ArtifactBadge kind="md5" value={rec.md5} />}
                  {!rec.sha256 && !rec.sha1 && !rec.md5 && (
                    <span className="text-xs text-muted">No cryptographic hashes saved for this sample yet.</span>
                  )}
                </div>
              </div>

              {/* Extracted C2 Infrastructure */}
              {rec.c2Servers && rec.c2Servers.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-line/40">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                    Extracted C2 Infrastructure &amp; Endpoints
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {rec.c2Servers.map((c2: string) => (
                      <ArtifactBadge
                        key={c2}
                        kind={c2.includes(".") && !c2.startsWith("http") && !/[a-zA-Z]/.test(c2) ? "ip" : "domain"}
                        value={c2}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SPECIAL SECTION FOR LABS: SHOW ASSOCIATED INVESTIGATIONS */}
          {key === "labs" && id !== "new" && (
            <section className="panel p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-line/40 pb-2">
                <div>
                  <h2 className="section-title">
                    Investigations Conducted in this Lab
                    <span className="badge-steel text-[11px] ml-2">{labInvestigations.length}</span>
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Hunts, triage sessions, and forensic investigations linked to this environment.
                  </p>
                </div>
                <Link
                  href={`/investigations/new?labId=${id}`}
                  className="btn-primary text-xs flex items-center gap-1"
                >
                  <Plus size={13} /> Launch Investigation
                </Link>
              </div>

              {labInvestigations.length > 0 ? (
                <div className="divide-y divide-line/40">
                  {labInvestigations.map((invItem) => {
                    const iocCount = invItem.evidence.reduce((acc, ev) => acc + ev.artifacts.length, 0);
                    return (
                      <div key={invItem.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <Link
                            href={`/investigations/${invItem.id}`}
                            className="font-semibold text-text hover:text-steel text-sm"
                          >
                            {invItem.title}
                          </Link>
                          <div className="flex items-center gap-3 text-[11px] text-muted mt-0.5">
                            <span>SIEM: <strong className="text-text">{invItem.siem || rec.siem}</strong></span>
                            <span>Evidence: <strong className="text-text">{invItem.evidence.length}</strong></span>
                            <span>IOCs: <strong className="text-text">{iocCount}</strong></span>
                            <span>Mappings: <strong className="text-text">{invItem.mappings.length}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/investigations/${invItem.id}`}
                            className="btn-secondary text-xs py-1 px-2.5"
                          >
                            Open Hunt →
                          </Link>
                          <form action={removeEntity.bind(null, "investigations", invItem.id, `/labs/${id}`)}>
                            <ConfirmButton
                              label="Delete"
                              variant="ghost"
                              confirmTitle="Delete Investigation"
                              confirmMessage={`Are you sure you want to permanently delete investigation "${invItem.title}"? This cannot be undone.`}
                            />
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-muted">
                  No investigations launched for this lab yet.
                </div>
              )}
            </section>
          )}

          {/* Delete Record */}
          {id !== "new" && (
            <div className="flex justify-end pt-1">
              <form action={removeEntity.bind(null, key, id)}>
                <ConfirmButton
                  label={`Delete ${e.title.replace(/s$/, "")}`}
                  confirmTitle={`Delete ${e.title.replace(/s$/, "")}`}
                  confirmMessage={`Are you sure you want to permanently delete this ${e.title.replace(/s$/, "").toLowerCase()} record?`}
                />
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
