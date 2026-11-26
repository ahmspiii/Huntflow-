"use client";
import { useState, useMemo } from "react";
import { Copy, Check, Terminal, ShieldAlert, Cpu } from "lucide-react";
import CodeBlock from "./CodeBlock";

export default function SigmaConverter({ sigmaYaml }: { sigmaYaml: string }) {
  const [activeTab, setActiveTab] = useState<"splunk" | "sentinel">("splunk");
  const [copied, setCopied] = useState(false);

  // Parse Sigma YAML and generate target SIEM queries
  const translations = useMemo(() => {
    if (!sigmaYaml || !sigmaYaml.trim()) {
      return {
        splunk: `index=* # Enter Sigma YAML above to generate Splunk SPL`,
        sentinel: `SecurityEvent # Enter Sigma YAML above to generate Sentinel KQL`,
        matchedRules: 0,
      };
    }

    const lines = sigmaYaml.split("\n");
    let inDetection = false;
    let eventId = "";
    const filters: { field: string; modifier: string; value: string }[] = [];

    for (let rawLine of lines) {
      const line = rawLine.trim();

      if (line.startsWith("detection:")) {
        inDetection = true;
        continue;
      }
      if (inDetection && line.startsWith("condition:")) {
        inDetection = false;
        continue;
      }

      if (inDetection && line.includes(":")) {
        const colonIdx = line.indexOf(":");
        let rawKey = line.substring(0, colonIdx).trim().replace(/^[-*]\s*/, "");
        let rawVal = line.substring(colonIdx + 1).trim().replace(/^['"]|['"]$/g, "");

        if (!rawVal || rawKey.toLowerCase() === "selection") continue;

        let [field, modifier = ""] = rawKey.split("|");
        modifier = modifier.toLowerCase();

        if (field.toLowerCase() === "eventid" || field.toLowerCase() === "eventcode") {
          eventId = rawVal;
        } else {
          filters.push({ field, modifier, value: rawVal });
        }
      }
    }

    // 1. Generate Splunk SPL
    let splunkClauses: string[] = [];
    if (eventId) {
      splunkClauses.push(`(EventCode=${eventId} OR EventID=${eventId})`);
    } else {
      splunkClauses.push(`index=*`);
    }

    for (let f of filters) {
      if (f.modifier === "contains") {
        splunkClauses.push(`${f.field}="*${f.value}*"`);
      } else if (f.modifier === "endswith") {
        splunkClauses.push(`${f.field}="*${f.value}"`);
      } else if (f.modifier === "startswith") {
        splunkClauses.push(`${f.field}="${f.value}*"`);
      } else {
        splunkClauses.push(`${f.field}="${f.value}"`);
      }
    }

    const splunkQuery = `${splunkClauses.join(" ")}\n| stats count min(_time) as firstTime max(_time) as lastTime by host, user, ${filters.slice(0, 3).map(f => f.field).join(", ") || "process_name"}\n| convert ctime(firstTime) ctime(lastTime)`;

    // 2. Generate Sentinel KQL
    let kqlLines: string[] = [];
    if (eventId) {
      kqlLines.push(`SecurityEvent\n| where EventID == ${eventId}`);
    } else {
      kqlLines.push(`DeviceProcessEvents`);
    }

    for (let f of filters) {
      if (f.modifier === "contains") {
        kqlLines.push(`| where ${f.field} contains "${f.value}"`);
      } else if (f.modifier === "endswith") {
        kqlLines.push(`| where ${f.field} endswith "${f.value}"`);
      } else if (f.modifier === "startswith") {
        kqlLines.push(`| where ${f.field} startswith "${f.value}"`);
      } else {
        kqlLines.push(`| where ${f.field} =~ "${f.value}"`);
      }
    }

    kqlLines.push(`| summarize Count = count(), FirstSeen = min(TimeGenerated), LastSeen = max(TimeGenerated) by Computer, Account, ${filters.slice(0, 2).map(f => f.field).join(", ") || "FileName"}`);

    return {
      splunk: splunkQuery,
      sentinel: kqlLines.join("\n"),
      matchedRules: (eventId ? 1 : 0) + filters.length,
    };
  }, [sigmaYaml]);

  const activeQuery = activeTab === "splunk" ? translations.splunk : translations.sentinel;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="panel p-3.5 space-y-3 bg-raised/20 border-line/70">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/40 pb-2">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-steel" />
          <span className="text-xs font-semibold text-text">Live Sigma to SIEM Converter</span>
          <span className="badge-steel text-[10px]">
            {translations.matchedRules} field filter{translations.matchedRules !== 1 ? "s" : ""} translated
          </span>
        </div>

        {/* SIEM Engine Tabs */}
        <div className="flex items-center gap-1 bg-ink p-0.5 rounded border border-line">
          <button
            type="button"
            onClick={() => setActiveTab("splunk")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === "splunk" ? "bg-steel/20 text-steel" : "text-muted hover:text-text"
            }`}
          >
            Splunk (SPL)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sentinel")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === "sentinel" ? "bg-steel/20 text-steel" : "text-muted hover:text-text"
            }`}
          >
            Microsoft Sentinel (KQL)
          </button>
        </div>
      </div>

      {/* Code Display with copy */}
      <div>
        <CodeBlock
          code={activeQuery}
          language={activeTab === "splunk" ? "SPLUNK SPL" : "SENTINEL KQL"}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted pt-1">
        <span>Ready for deployment directly into your SIEM search bar.</span>
        <button
          type="button"
          onClick={handleCopy}
          className="btn-primary py-0.5 px-2 text-[11px]"
        >
          {copied ? <Check size={11} className="text-confirmed" /> : <Copy size={11} />}
          {copied ? "Copied Query" : `Copy ${activeTab === "splunk" ? "SPL" : "KQL"}`}
        </button>
      </div>
    </div>
  );
}
