"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, FileText, Clock, ShieldCheck, Database, Layers } from "lucide-react";

type InvestigationTabsProps = {
  evidenceCount: number;
  timelineCount: number;
  mappingsCount: number;
  totalArtifactsCount: number;
  evidenceContent: React.ReactNode;
  overviewContent: React.ReactNode;
  timelineContent: React.ReactNode;
  mappingsContent: React.ReactNode;
};

export default function InvestigationTabs({
  evidenceCount,
  timelineCount,
  mappingsCount,
  totalArtifactsCount,
  evidenceContent,
  overviewContent,
  timelineContent,
  mappingsContent,
}: InvestigationTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "evidence";

  const [activeTab, setActiveTab] = useState<"evidence" | "overview" | "timeline" | "mappings">(
    (initialTab as any) || "evidence"
  );

  const handleTabChange = (tab: "evidence" | "overview" | "timeline" | "mappings") => {
    setActiveTab(tab);
    // Update URL query param without refreshing page
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-line bg-surface/50 p-1 rounded-t-lg overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange("evidence")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === "evidence"
              ? "bg-panel text-steel font-bold shadow-sm border border-line"
              : "text-muted hover:text-text hover:bg-raised"
          }`}
        >
          <Search size={14} className={activeTab === "evidence" ? "text-steel" : "text-muted"} />
          <span>Evidence &amp; Artifacts</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
            activeTab === "evidence" ? "bg-steel/15 text-steel font-bold" : "bg-raised text-muted"
          }`}>
            {evidenceCount}
          </span>
          {totalArtifactsCount > 0 && (
            <span className="text-[10px] text-muted">({totalArtifactsCount} IOCs)</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("overview")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-panel text-steel font-bold shadow-sm border border-line"
              : "text-muted hover:text-text hover:bg-raised"
          }`}
        >
          <FileText size={14} className={activeTab === "overview" ? "text-steel" : "text-muted"} />
          <span>Hypothesis &amp; Scope</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("timeline")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === "timeline"
              ? "bg-panel text-steel font-bold shadow-sm border border-line"
              : "text-muted hover:text-text hover:bg-raised"
          }`}
        >
          <Clock size={14} className={activeTab === "timeline" ? "text-steel" : "text-muted"} />
          <span>Attack Timeline</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
            activeTab === "timeline" ? "bg-steel/15 text-steel font-bold" : "bg-raised text-muted"
          }`}>
            {timelineCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("mappings")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === "mappings"
              ? "bg-panel text-steel font-bold shadow-sm border border-line"
              : "text-muted hover:text-text hover:bg-raised"
          }`}
        >
          <ShieldCheck size={14} className={activeTab === "mappings" ? "text-steel" : "text-muted"} />
          <span>MITRE ATT&amp;CK</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
            activeTab === "mappings" ? "bg-steel/15 text-steel font-bold" : "bg-raised text-muted"
          }`}>
            {mappingsCount}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        <div className={activeTab === "evidence" ? "block" : "hidden"}>
          {evidenceContent}
        </div>
        <div className={activeTab === "overview" ? "block" : "hidden"}>
          {overviewContent}
        </div>
        <div className={activeTab === "timeline" ? "block" : "hidden"}>
          {timelineContent}
        </div>
        <div className={activeTab === "mappings" ? "block" : "hidden"}>
          {mappingsContent}
        </div>
      </div>
    </div>
  );
}
