// Derived coverage: strongest evidence of work wins. Override is applied by caller.
export type Cov = "NOT_PRACTICED"|"OBSERVED"|"INVESTIGATED"|"DETECTION_CREATED"|"DETECTION_VALIDATED";
export function deriveCoverage(i: { suspected: number; confirmed: number; rules: number; validatedRules: number }): Cov {
  if (i.validatedRules > 0) return "DETECTION_VALIDATED";
  if (i.rules > 0) return "DETECTION_CREATED";
  if (i.confirmed > 0) return "INVESTIGATED";
  if (i.suspected > 0) return "OBSERVED";
  return "NOT_PRACTICED";
}
import { db } from "./db";
export const COV_ORDER: Cov[] = ["NOT_PRACTICED","OBSERVED","INVESTIGATED","DETECTION_CREATED","DETECTION_VALIDATED"];
export const COV_CLASS: Record<Cov, string> = { NOT_PRACTICED: "bg-raised text-muted", OBSERVED: "bg-suspected/30", INVESTIGATED: "bg-confirmed/30", DETECTION_CREATED: "bg-steel/30", DETECTION_VALIDATED: "bg-steel/70 text-ink" };
export async function getCoverage() {
  const ts = await db.technique.findMany({ where: { revoked: false, deprecated: false, isSubtechnique: false }, select: { id: true, attackId: true, name: true, tactics: { select: { tacticId: true } },
    mappings: { select: { status: true } }, rules: { select: { rule: { select: { validation: true } } } }, coverage: true } });
  return ts.map(t => ({ ...t, status: t.coverage?.status ?? deriveCoverage({ suspected: t.mappings.filter(m => m.status === "SUSPECTED").length, confirmed: t.mappings.filter(m => m.status === "CONFIRMED").length,
    rules: t.rules.length, validatedRules: t.rules.filter(r => r.rule.validation === "VALIDATED").length }) as Cov }));
}
