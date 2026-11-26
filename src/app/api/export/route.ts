import { db } from "@/lib/db"; import { ENT } from "@/lib/entities";
export const dynamic = "force-dynamic";
const csv = (rows: any[]) => { if (!rows.length) return ""; const h = Object.keys(rows[0]); const q = (v: any) => `"${String(typeof v === "object" ? JSON.stringify(v) : v ?? "").replace(/"/g, '""')}"`;
  return [h.join(","), ...rows.map(r => h.map(k => q(r[k])).join(","))].join("\n"); };
export async function GET(req: Request) {
  const u = new URL(req.url), ent = u.searchParams.get("entity") ?? "all", fmt = u.searchParams.get("format") ?? "json";
  const get = (m: string) => (db as any)[m].findMany();
  let body: string, name = `huntflow-${ent}`;
  if (ent === "all") { const d: any = {}; for (const k of Object.keys(ENT)) d[k] = await get(ENT[k].model); for (const m of ["evidence","timelineEvent","artifact","techniqueMapping","coverageOverride"]) d[m] = await get(m); body = JSON.stringify(d, null, 2); }
  else { if (!ENT[ent]) return new Response("Unknown entity", { status: 404 }); const rows = await get(ENT[ent].model); body = fmt === "csv" ? csv(rows) : JSON.stringify(rows, null, 2); }
  return new Response(body, { headers: { "content-type": fmt === "csv" ? "text/csv" : "application/json", "content-disposition": `attachment; filename=${name}.${fmt === "csv" ? "csv" : "json"}` } });
}
