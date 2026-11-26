import { db } from "./db";
// Service-layer rule: a mapping can only be CONFIRMED with supporting evidence.
export async function saveMapping(d: { investigationId: string; techniqueId: string; evidenceId?: string|null; status: "SUSPECTED"|"CONFIRMED"; confidence?: number; rationale?: string }) {
  if (d.status === "CONFIRMED") {
    if (!d.evidenceId) throw new Error("Confirmed mappings require linked evidence.");
    const ev = await db.evidence.findFirst({ where: { id: d.evidenceId, investigationId: d.investigationId } });
    if (!ev) throw new Error("Evidence not found in this investigation.");
  }
  return db.techniqueMapping.create({ data: { ...d, evidenceId: d.evidenceId ?? null } });
}
