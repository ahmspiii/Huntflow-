import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import {
  FileCode, Shield, Search, FlaskConical, Bug, Hash, Library,
  ShieldCheck, Activity, Terminal, ExternalLink, ArrowRight,
  Database, CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function Docs() {
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="HuntFlow Platform Documentation"
        subtitle="Complete reference manual for Threat Hunting, Detection Engineering, and Malware Intelligence workflows."
        icon={FileCode}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Documentation" },
        ]}
      />

      {/* 1. Core Architecture & Workflow */}
      <section className="panel p-5 space-y-4">
        <h2 className="section-title flex items-center gap-2 text-base">
          <FlaskConical size={16} className="text-steel" />
          1. The Threat Hunting Lifecycle in HuntFlow
        </h2>
        <p className="text-xs text-text/80 leading-relaxed">
          HuntFlow is structured around modern intelligence-driven threat hunting methodologies (e.g. TaHiTI, PEAK, MITRE ATT&CK):
        </p>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded bg-raised/40 border border-line space-y-1">
            <span className="font-bold text-steel block">Labs (Simulation Environments)</span>
            <p className="text-muted leading-relaxed">
              Parent containers representing your range or SIEM target (e.g. Splunk BOTS, CyberDefenders, TryHackMe, or local AD Sysmon).
            </p>
          </div>

          <div className="p-3 rounded bg-raised/40 border border-line space-y-1">
            <span className="font-bold text-steel block">Investigations (Active Hunts)</span>
            <p className="text-muted leading-relaxed">
              Hypothesis-driven cases containing executed SIEM queries, timeline events, evidence repositories, and findings.
            </p>
          </div>

          <div className="p-3 rounded bg-raised/40 border border-line space-y-1">
            <span className="font-bold text-danger block">Malware Samples</span>
            <p className="text-muted leading-relaxed">
              Reverse-engineering repository for static file analysis, API imports, extracted strings, and behavioral C2 beaconing.
            </p>
          </div>

          <div className="p-3 rounded bg-raised/40 border border-line space-y-1">
            <span className="font-bold text-confirmed block">Detection Engineering</span>
            <p className="text-muted leading-relaxed">
              Sigma rules automatically convertible to Splunk (SPL) and Microsoft Sentinel (KQL), with MITRE coverage gap analysis.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Automated Threat Intelligence Enrichment */}
      <section className="panel p-5 space-y-4">
        <h2 className="section-title flex items-center gap-2 text-base">
          <ShieldCheck size={16} className="text-steel" />
          2. Live Threat Intelligence &amp; Artifact Enrichment
        </h2>
        <p className="text-xs text-text/80 leading-relaxed">
          Every IOC artifact entered into HuntFlow (IP, File Hash, or Domain) supports live on-demand intelligence lookup:
        </p>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded bg-raised/30 border border-line flex items-start gap-3">
            <span className="badge-steel text-[10px] font-mono shrink-0">IP Addresses</span>
            <div>
              <strong className="text-text">Concurrent Dual-API Query (AbuseIPDB + VirusTotal):</strong>
              <p className="text-muted mt-0.5 leading-relaxed">
                Queries AbuseIPDB v2 for confidence score, total reports, ISP, and Tor exit node status; concurrently queries VirusTotal v3 for vendor detections, AS owner, and network CIDR.
              </p>
            </div>
          </div>

          <div className="p-3 rounded bg-raised/30 border border-line flex items-start gap-3">
            <span className="badge-danger text-[10px] font-mono shrink-0">File Hashes</span>
            <div>
              <strong className="text-text">VirusTotal File Intelligence (MD5, SHA-1, SHA-256):</strong>
              <p className="text-muted mt-0.5 leading-relaxed">
                Queries VirusTotal v3 for malware detection ratio, identified binary names, file formats, and threat classification tags.
              </p>
            </div>
          </div>

          <div className="p-3 rounded bg-raised/30 border border-line flex items-start gap-3">
            <span className="badge bg-confirmed/15 text-confirmed border border-confirmed/30 text-[10px] font-mono shrink-0">Domains / URLs</span>
            <div>
              <strong className="text-text">VirusTotal Domain Intelligence:</strong>
              <p className="text-muted mt-0.5 leading-relaxed">
                Provides registrar information, security vendor maliciousness ratios, and domain categorizations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MITRE ATT&CK Matrix & Coverage Rules */}
      <section className="panel p-5 space-y-4">
        <h2 className="section-title flex items-center gap-2 text-base">
          <Shield size={16} className="text-steel" />
          3. MITRE ATT&amp;CK Coverage Engine
        </h2>
        <p className="text-xs text-text/80 leading-relaxed">
          Coverage statuses are dynamically calculated based on evidentiary backing and detection validation:
        </p>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-raised/40 text-muted uppercase text-[10px]">
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Condition Required</th>
                <th className="py-2 px-3">Visual Color</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/30">
              <tr>
                <td className="py-2 px-3 font-semibold text-text">DETECTION_VALIDATED</td>
                <td className="py-2 px-3 text-muted">A Detection Rule mapped to this technique has status = VALIDATED</td>
                <td className="py-2 px-3"><span className="badge bg-steel/70 text-ink">Solid Steel</span></td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-text">DETECTION_CREATED</td>
                <td className="py-2 px-3 text-muted">A Detection Rule exists for this technique (DRAFT or TESTING)</td>
                <td className="py-2 px-3"><span className="badge bg-steel/30 text-steel">Steel Tint</span></td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-text">INVESTIGATED</td>
                <td className="py-2 px-3 text-muted">Linked to an investigation with evidentiary backing (CONFIRMED)</td>
                <td className="py-2 px-3"><span className="badge bg-confirmed/30 text-confirmed">Confirmed Green</span></td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-text">OBSERVED</td>
                <td className="py-2 px-3 text-muted">Mapped to an investigation as SUSPECTED (unverified evidence)</td>
                <td className="py-2 px-3"><span className="badge bg-suspected/30 text-suspected">Amber</span></td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-text">NOT_PRACTICED</td>
                <td className="py-2 px-3 text-muted">No rules or investigations linked to this technique yet</td>
                <td className="py-2 px-3"><span className="badge bg-raised text-muted">Muted Dark</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Keyboard Shortcuts */}
      <section className="panel p-5 space-y-3">
        <h2 className="section-title flex items-center gap-2 text-base">
          <Terminal size={16} className="text-steel" />
          4. Platform Shortcuts &amp; Command Palette
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded bg-raised/30 border border-line">
            <span className="text-text font-medium">Open Command Palette (Quick Spotlight)</span>
            <kbd className="font-mono text-[10px] bg-panel px-2 py-0.5 rounded border border-line text-steel">
              Ctrl + K / ⌘ + K
            </kbd>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded bg-raised/30 border border-line">
            <span className="text-text font-medium">Close Modals / Overlays</span>
            <kbd className="font-mono text-[10px] bg-panel px-2 py-0.5 rounded border border-line text-muted">
              Escape
            </kbd>
          </div>
        </div>
      </section>

      {/* Author Footer */}
      <div className="panel p-4 bg-raised/30 flex items-center justify-between text-xs text-muted">
        <div>
          <span>HuntFlow Threat Hunting Workflow Platform</span>
          <div className="text-text font-bold mt-0.5">Engineered by Ahmed Alaa</div>
        </div>
        <Link href="/" className="text-steel hover:underline flex items-center gap-1">
          Back to Dashboard <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
