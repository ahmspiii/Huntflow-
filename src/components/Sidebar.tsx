"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard, FlaskConical, Search, Shield, Library,
  ShieldCheck, ListChecks, BookOpen, Grid3x3, Download,
  ChevronLeft, ChevronRight, Bug, Hash, FileCode,
} from "lucide-react";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const items = [
  ["/", "Dashboard", LayoutDashboard],
  ["/labs", "Labs", FlaskConical],
  ["/investigations", "Investigations", Search],
  ["/malware", "Malware Samples", Bug],
  ["/iocs", "IOC Repository", Hash],
  ["/mitre", "ATT&CK Explorer", Shield],
  ["/coverage", "Coverage Matrix", Grid3x3],
  ["/queries", "Query Library", Library],
  ["/detections", "Detections", ShieldCheck],
  ["/playbooks", "Playbooks", ListChecks],
  ["/knowledge", "Knowledge Base", BookOpen],
  ["/docs", "Documentation", FileCode],
] as const;

const groups = [
  { label: "Overview", items: [0] },
  { label: "Threat Hunting", items: [1, 2, 3, 4] },
  { label: "MITRE ATT&CK", items: [5, 6] },
  { label: "Detection Engineering", items: [7, 8, 9] },
  { label: "Research & Docs", items: [10, 11] },
];

export default function Sidebar() {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      aria-label="Main"
      className={clsx(
        "shrink-0 border-b md:border-b-0 md:border-r border-line bg-panel flex flex-col transition-all duration-300",
        collapsed ? "md:w-16" : "md:w-60"
      )}
    >
      {/* Logo area */}
      <div className={clsx("flex items-center border-b border-line/40 px-3", collapsed ? "justify-center py-4" : "gap-3 py-4")}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-steel/15 shrink-0">
          <Shield size={18} className="text-steel" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-base font-bold tracking-tight text-text">HuntFlow</div>
            <div className="text-[10px] text-muted leading-none">by Ahmed Alaa</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex ml-auto p-1 rounded hover:bg-raised text-muted hover:text-text transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Quick Search trigger */}
      <div className="px-2 pt-2 pb-1">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
          className={clsx(
            "w-full flex items-center gap-2 rounded border border-line/60 bg-raised/40 px-2.5 py-1.5 text-xs text-muted hover:border-steel/50 hover:text-text transition-colors",
            collapsed ? "justify-center" : "justify-between"
          )}
          title="Search HuntFlow (Ctrl+K)"
        >
          <span className="flex items-center gap-2">
            <Search size={14} className="text-steel" />
            {!collapsed && <span>Search...</span>}
          </span>
          {!collapsed && (
            <kbd className="text-[10px] font-mono bg-panel px-1.5 py-0.5 rounded border border-line text-muted">
              Ctrl K
            </kbd>
          )}
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
        <ul className="flex md:flex-col gap-0.5 overflow-x-auto">
          {groups.map((group) => (
            <li key={group.label}>
              {!collapsed && (
                <div className="px-2 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted/60">
                  {group.label}
                </div>
              )}
              {collapsed && <div className="my-1 mx-2 border-t border-line/30" />}
              <ul className="space-y-0.5">
                {group.items.map((idx) => {
                  const [href, label, Icon] = items[idx];
                  const active = href === "/" ? path === "/" : path.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        title={collapsed ? label : undefined}
                        className={clsx(
                          "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors",
                          active
                            ? "bg-steel/15 text-steel font-medium"
                            : "text-muted hover:text-text hover:bg-raised"
                        )}
                      >
                        <Icon size={15} />
                        {!collapsed && label}
                        {active && !collapsed && (
                          <span className="ml-auto w-1 h-1 rounded-full bg-steel" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom section */}
      <div className={clsx("border-t border-line/40 p-2 flex items-center gap-1.5", collapsed ? "flex-col justify-center" : "justify-between")}>
        <a
          href="/api/export?entity=all"
          title="Backup all data as JSON"
          className={clsx(
            "flex items-center gap-2 rounded px-2 py-1.5 text-xs text-muted hover:text-text hover:bg-raised transition-colors flex-1 truncate",
            collapsed && "justify-center"
          )}
        >
          <Download size={14} className="shrink-0" />
          {!collapsed && <span className="truncate">Backup (JSON)</span>}
        </a>
        <ThemeToggle />
      </div>
    </nav>
  );
}
