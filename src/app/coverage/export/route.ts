import { db } from "@/lib/db"; import { getCoverage, COV_ORDER } from "@/lib/coverage";
export async function GET(req: Request) {
  const s = new URL(req.url).searchParams.get("s"); const v = await db.attackVersion.findFirst({ orderBy: { importedAt: "desc" } });
  const techniques = (await getCoverage()).filter(t => t.status !== "NOT_PRACTICED" && (!s || t.status === s)).map(t => ({ techniqueID: t.attackId, score: COV_ORDER.indexOf(t.status), comment: t.status, enabled: true }));
  const layer = { name: "HuntFlow coverage", versions: { attack: (v?.version ?? "v17").replace("v", "").split(".")[0], navigator: "5.1.0", layer: "4.5" }, domain: "enterprise-attack",
    gradient: { colors: ["#2a3340", "#e0a84b", "#4fb69a", "#5aa9d6", "#2f7fb0"], minValue: 0, maxValue: 4 }, techniques };
  return new Response(JSON.stringify(layer, null, 2), { headers: { "content-type": "application/json", "content-disposition": "attachment; filename=huntflow-layer.json" } });
}
