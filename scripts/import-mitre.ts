// Idempotent import of MITRE ATT&CK Enterprise STIX 2.1. Usage: npm run mitre:import [-- <version-tag>]
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const URL = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json";
const ext = (o: any) => o.external_references?.find((r: any) => r.source_name === "mitre-attack");
async function main() {
  const bundle: any = await (await fetch(URL)).json();
  const objs: any[] = bundle.objects;
  const spec = objs.find(o => o.type === "x-mitre-collection");
  const vtag = process.argv[2] ?? `v${spec?.x_mitre_version ?? "unknown"}`;
  const ver = await db.attackVersion.upsert({ where: { version: vtag }, update: {}, create: { version: vtag } });
  const matrix = objs.find(o => o.type === "x-mitre-matrix");
  const tacticIds: string[] = matrix?.tactic_refs ?? [];
  const tacticByShort = new Map<string, string>();
  for (const o of objs.filter(o => o.type === "x-mitre-tactic")) {
    const t = await db.tactic.upsert({ where: { versionId_attackId: { versionId: ver.id, attackId: ext(o).external_id } },
      update: { name: o.name, description: o.description ?? "" },
      create: { versionId: ver.id, stixId: o.id, shortname: o.x_mitre_shortname, attackId: ext(o).external_id, name: o.name, description: o.description ?? "", order: Math.max(0, tacticIds.indexOf(o.id)) } });
    tacticByShort.set(o.x_mitre_shortname, t.id);
  }
  let n = 0;
  for (const o of objs.filter(o => o.type === "attack-pattern")) {
    const id = ext(o)?.external_id; if (!id) continue;
    const data = { stixId: o.id, name: o.name, description: o.description ?? "", platforms: o.x_mitre_platforms ?? [],
      detection: o.x_mitre_detection ?? "", dataSources: o.x_mitre_data_sources ?? [], isSubtechnique: !!o.x_mitre_is_subtechnique,
      parentAttackId: o.x_mitre_is_subtechnique ? id.split(".")[0] : null, revoked: !!o.revoked, deprecated: !!o.x_mitre_deprecated };
    const t = await db.technique.upsert({ where: { versionId_attackId: { versionId: ver.id, attackId: id } }, update: data, create: { versionId: ver.id, attackId: id, ...data } });
    for (const p of o.kill_chain_phases ?? []) {
      const tid = tacticByShort.get(p.phase_name); if (!tid) continue;
      await db.techniqueTactic.upsert({ where: { techniqueId_tacticId: { techniqueId: t.id, tacticId: tid } }, update: {}, create: { techniqueId: t.id, tacticId: tid } });
    }
    n++;
  }
  console.log(`Imported ${n} techniques into ATT&CK ${vtag}`);
}
main().finally(() => db.$disconnect());
