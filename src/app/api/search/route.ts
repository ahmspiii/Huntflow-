import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const [techniques, investigations, queries, detections, labs, malware, playbooks, artifacts] = await Promise.all([
    db.technique.findMany({
      where: {
        revoked: false,
        deprecated: false,
        OR: [
          { attackId: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, attackId: true, name: true },
      take: 6,
    }),
    db.investigation.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { hypothesis: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, siem: true },
      take: 5,
    }),
    db.huntingQuery.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, language: true },
      take: 4,
    }),
    db.detectionRule.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sigma: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, severity: true },
      take: 4,
    }),
    db.lab.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { source: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, source: true },
      take: 4,
    }),
    db.malwareSample.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { family: { contains: q, mode: "insensitive" } },
          { sha256: { contains: q, mode: "insensitive" } },
          { md5: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, family: true, classification: true },
      take: 4,
    }),
    db.playbook.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { hypothesis: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true },
      take: 3,
    }),
    db.artifact.findMany({
      where: {
        value: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        kind: true,
        value: true,
        evidence: { select: { investigationId: true } },
      },
      take: 4,
    }),
  ]);

  const results = [
    ...techniques.map((t) => ({
      category: "MITRE ATT&CK",
      title: `${t.attackId}: ${t.name}`,
      subtitle: "Technique Explorer",
      href: `/mitre/${t.id}`,
      badge: t.attackId,
    })),
    ...investigations.map((i) => ({
      category: "Investigations",
      title: i.title,
      subtitle: i.siem ? `SIEM: ${i.siem}` : "Investigation",
      href: `/investigations/${i.id}`,
      badge: "Investigation",
    })),
    ...malware.map((m) => ({
      category: "Malware Samples",
      title: m.name,
      subtitle: m.family ? `Family: ${m.family}` : m.classification,
      href: `/malware/${m.id}`,
      badge: m.classification.toUpperCase(),
    })),
    ...artifacts.map((a) => ({
      category: "IOCs",
      title: a.value,
      subtitle: `Artifact (${a.kind})`,
      href: a.evidence?.investigationId ? `/investigations/${a.evidence.investigationId}` : `/iocs?q=${encodeURIComponent(a.value)}`,
      badge: a.kind.toUpperCase(),
    })),
    ...queries.map((qItem) => ({
      category: "Query Library",
      title: qItem.title,
      subtitle: `Language: ${qItem.language}`,
      href: `/queries/${qItem.id}`,
      badge: qItem.language,
    })),
    ...detections.map((d) => ({
      category: "Detection Rules",
      title: d.name,
      subtitle: `Severity: ${d.severity}`,
      href: `/detections/${d.id}`,
      badge: d.severity,
    })),
    ...playbooks.map((p) => ({
      category: "Playbooks",
      title: p.title,
      subtitle: "Hunting Playbook",
      href: `/playbooks/${p.id}`,
      badge: "Playbook",
    })),
    ...labs.map((l) => ({
      category: "Labs",
      title: l.name,
      subtitle: `Source: ${l.source}`,
      href: `/labs/${l.id}`,
      badge: "Lab",
    })),
  ];

  return NextResponse.json({ results });
}
