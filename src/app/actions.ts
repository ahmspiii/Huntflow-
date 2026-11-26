"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ENT } from "@/lib/entities";
import { saveMapping } from "@/lib/mapping";

const D = (m: string) => (db as any)[m];
const err = (p: string, m: string) => redirect(`${p}${p.includes("?") ? "&" : "?"}error=${encodeURIComponent(m)}`);
const ok = (p: string, msg: string) => redirect(`${p}${p.includes("?") ? "&" : "?"}notice=${encodeURIComponent(msg)}`);

const hashSchema = {
  md5: z.string().regex(/^[a-fA-F0-9]{32}$/, "MD5 must be 32 hex characters").or(z.literal("")),
  sha1: z.string().regex(/^[a-fA-F0-9]{40}$/, "SHA-1 must be 40 hex characters").or(z.literal("")),
  sha256: z.string().regex(/^[a-fA-F0-9]{64}$/, "SHA-256 must be 64 hex characters").or(z.literal("")),
};

export async function saveEntity(key: string, id: string, fd: FormData) {
  const e = ENT[key]; const data: any = {}; let bad = "";
  for (const f of e.fields) {
    const v = (fd.get(f.name)?.toString() ?? "").trim();
    if (f.required && !v) bad = `${f.label} is required`;
    if (!bad && (f.name === "md5" || f.name === "sha1" || f.name === "sha256")) {
      const check = hashSchema[f.name].safeParse(v);
      if (!check.success) bad = check.error.issues[0]?.message ?? `${f.label} format is invalid`;
    }
    try {
      data[f.name] = f.type === "tags" ? v.split(",").map(s => s.trim()).filter(Boolean) : f.type === "lines" ? v.split("\n").map(s => s.trim()).filter(Boolean).map(title => ({ title }))
        : f.type === "json" ? (v ? JSON.parse(v) : {}) : f.type === "ref" ? (v || null) : v;
    } catch { bad = `${f.label} is not valid JSON`; }
  }
  if (bad) err(`/${key}/${id}`, bad);
  const rec = id === "new" ? await D(e.model).create({ data }) : await D(e.model).update({ where: { id }, data });
  if (e.join) {
    const ids = (fd.get("techniques")?.toString() ?? "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    const ts = await db.technique.findMany({ where: { attackId: { in: ids }, revoked: false }, distinct: ["attackId"], select: { id: true } });
    await D(e.join.model).deleteMany({ where: { [e.join.fk]: rec.id } });
    if (ts.length) await D(e.join.model).createMany({ data: ts.map(t => ({ [e.join!.fk]: rec.id, techniqueId: t.id })) });
  }
  revalidatePath(`/${key}`);
  ok(`/${key}/${rec.id}`, `${e.title.replace(/s$/, "")} saved`);
}
export async function removeEntity(key: string, id: string, redirectTo?: string | FormData) {
  const target = typeof redirectTo === "string" && redirectTo ? redirectTo : `/${key}`;
  await D(ENT[key].model).delete({ where: { id } });
  revalidatePath(`/${key}`);
  if (target !== `/${key}`) {
    revalidatePath(target);
  }
  ok(target, `${ENT[key].title.replace(/s$/, "")} deleted`);
}
export async function addEvidence(inv: string, fd: FormData) {
  const title = fd.get("title")?.toString().trim(); if (!title) err(`/investigations/${inv}`, "Evidence title is required");
  const ev = await db.evidence.create({ data: { investigationId: inv, title: title!, source: fd.get("source")?.toString() ?? "", description: fd.get("description")?.toString() ?? "" } });
  const art = (fd.get("artifacts")?.toString() ?? "").split("\n").map(s => s.trim()).filter(s => s.includes(":"));
  for (const a of art) { const [kind, ...r] = a.split(":"); await db.artifact.create({ data: { evidenceId: ev.id, kind: kind.trim(), value: r.join(":").trim() } }); }
  revalidatePath(`/investigations/${inv}`); redirect(`/investigations/${inv}`);
}
export async function delEvidence(inv: string, id: string) {
  await db.techniqueMapping.updateMany({ where: { evidenceId: id, status: "CONFIRMED" }, data: { status: "SUSPECTED" } }); // no evidence, no confirmation
  await db.evidence.delete({ where: { id } }); revalidatePath(`/investigations/${inv}`); redirect(`/investigations/${inv}`);
}
export async function addMapping(inv: string, fd: FormData) {
  const p = `/investigations/${inv}`;
  try {
    const t = await db.technique.findFirst({ where: { attackId: (fd.get("attackId")?.toString() ?? "").trim().toUpperCase(), revoked: false } });
    if (!t) throw new Error("Unknown technique ID. Check the ID or run the ATT&CK import.");
    await saveMapping({
      investigationId: inv, techniqueId: t.id, evidenceId: fd.get("evidenceId")?.toString() || null, status: fd.get("status") === "CONFIRMED" ? "CONFIRMED" : "SUSPECTED",
      confidence: Number(fd.get("confidence") ?? 50), rationale: fd.get("rationale")?.toString() ?? ""
    });
  } catch (e: any) { err(p, e.message); }
  revalidatePath(p); redirect(p);
}
export async function delMapping(inv: string, id: string) { await db.techniqueMapping.delete({ where: { id } }); revalidatePath(`/investigations/${inv}`); redirect(`/investigations/${inv}`); }
export async function addTimelineEvent(inv: string, fd: FormData) {
  const description = fd.get("description")?.toString().trim();
  if (!description) err(`/investigations/${inv}`, "Event description is required");
  const rawDate = fd.get("occurredAt")?.toString();
  const occurredAt = rawDate ? new Date(rawDate) : new Date();
  const source = fd.get("source")?.toString().trim() ?? "";
  const evidenceId = fd.get("evidenceId")?.toString().trim() || null;
  await db.timelineEvent.create({
    data: {
      investigationId: inv,
      occurredAt,
      source,
      description: description!,
      evidenceId,
    },
  });
  revalidatePath(`/investigations/${inv}`);
  redirect(`/investigations/${inv}`);
}
export async function delTimelineEvent(inv: string, id: string) {
  await db.timelineEvent.delete({ where: { id } });
  revalidatePath(`/investigations/${inv}`);
  redirect(`/investigations/${inv}`);
}
export async function saveNote(id: string, fd: FormData) { await db.technique.update({ where: { id }, data: { notes: fd.get("notes")?.toString() ?? "" } }); revalidatePath(`/mitre/${id}`); ok(`/mitre/${id}`, "Notes saved"); }

const ruleTestSchema = z.object({
  environment: z.string().min(1, "Environment is required"),
  result: z.enum(["PASS", "FALSE_POSITIVE", "FAILED"]),
  notes: z.string().optional(),
});

export async function addRuleTestLog(ruleId: string, fd: FormData) {
  const parsed = ruleTestSchema.safeParse({
    environment: (fd.get("environment")?.toString() ?? "").trim(),
    result: (fd.get("result")?.toString() ?? "PASS").trim(),
    notes: (fd.get("notes")?.toString() ?? "").trim(),
  });
  if (!parsed.success) {
    err(`/detections/${ruleId}`, parsed.error.issues[0]?.message ?? "Invalid test log input");
  }
  await db.ruleTestLog.create({
    data: {
      ruleId,
      environment: parsed.data!.environment,
      result: parsed.data!.result,
      notes: parsed.data!.notes ?? "",
    },
  });
  revalidatePath(`/detections/${ruleId}`);
  ok(`/detections/${ruleId}`, "Test log recorded");
}

export async function delRuleTestLog(ruleId: string, id: string) {
  await db.ruleTestLog.delete({ where: { id } });
  revalidatePath(`/detections/${ruleId}`);
  ok(`/detections/${ruleId}`, "Test log removed");
}
