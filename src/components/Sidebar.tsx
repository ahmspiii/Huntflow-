"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard, FlaskConical, Search, Shield, Library,
  ShieldCheck, ListChecks, BookOpen, Grid3x3, Download,
  ChevronLeft, ChevronRight, Bug, Hash, FileCode, Menu, X, Keyboard,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer automatically on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  const navContent = (isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div
        className={clsx(
          "flex items-center border-b border-line/40 px-3",
          collapsed && !isMobileDrawer ? "justify-center py-4" : "gap-3 py-4"
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-steel/15 shrink-0">
          <Shield size={18} className="text-steel" />
        </div>
        {(!collapsed || isMobileDrawer) && (
          <div>
            <div className="text-base font-bold tracking-tight text-text">HuntFlow</div>
            <div className="text-[10px] text-muted leading-none">by Ahmed Alaa</div>
          </div>
        )}
        {isMobileDrawer ? (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded hover:bg-raised text-muted hover:text-text transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex ml-auto p-1 rounded hover:bg-raised text-muted hover:text-text transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Quick Search trigger */}
      <div className="px-2 pt-2 pb-1">
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            window.dispatchEvent(new CustomEvent("open-command-palette"));
          }}
          className={clsx(
            "w-full flex items-center gap-2 rounded border border-line/60 bg-raised/40 px-2.5 py-1.5 text-xs text-muted hover:border-steel/50 hover:text-text transition-colors",
            collapsed && !isMobileDrawer ? "justify-center" : "justify-between"
          )}
          title="Search HuntFlow (Ctrl+K)"
        >
          <span className="flex items-center gap-2">
            <Search size={14} className="text-steel" />
            {(!collapsed || isMobileDrawer) && <span>Search...</span>}
          </span>
          {(!collapsed || isMobileDrawer) && (
            <kbd className="text-[10px] font-mono bg-panel px-1.5 py-0.5 rounded border border-line text-muted">
              Ctrl K
            </kbd>
          )}
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
        <ul className="flex flex-col gap-0.5">
          {groups.map((group) => (
            <li key={group.label}>
              {(!collapsed || isMobileDrawer) && (
                <div className="px-2 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted/60">
                  {group.label}
                </div>
              )}
              {collapsed && !isMobileDrawer && <div className="my-1 mx-2 border-t border-line/30" />}
              <ul className="space-y-0.5">
                {group.items.map((idx) => {
                  const [href, label, Icon] = items[idx];
                  const active = href === "/" ? path === "/" : path.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        title={collapsed && !isMobileDrawer ? label : undefined}
                        className={clsx(
                          "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-xs whitespace-nowrap transition-all duration-150",
                          active
                            ? "bg-steel/15 text-steel font-medium"
                            : "text-muted hover:text-text hover:bg-raised hover:translate-x-0.5"
                        )}
                      >
                        <Icon size={15} />
                        {(!collapsed || isMobileDrawer) && label}
                        {active && (!collapsed || isMobileDrawer) && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-steel" />
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
      <div
        className={clsx(
          "border-t border-line/40 p-2 flex items-center gap-1",
          collapsed && !isMobileDrawer ? "flex-col justify-center" : "justify-between"
        )}
      >
        <a
          href="/api/export?entity=all"
          title="Backup all data as JSON"
          className={clsx(
            "flex items-center gap-2 rounded px-2 py-1.5 text-xs text-muted hover:text-text hover:bg-raised transition-colors flex-1 truncate",
            collapsed && !isMobileDrawer && "justify-center"
          )}
        >
          <Download size={14} className="shrink-0" />
          {(!collapsed || isMobileDrawer) && <span className="truncate">Backup</span>}
        </a>
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            window.dispatchEvent(new CustomEvent("open-shortcuts-modal"));
          }}
          title="Keyboard Shortcuts (?)"
          className="p-1.5 rounded hover:bg-raised text-muted hover:text-text transition-colors"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard size={14} />
        </button>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 border-b border-line bg-panel">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-steel/15">
            <Shield size={15} className="text-steel" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-text leading-tight">HuntFlow</div>
            <div className="text-[10px] text-muted leading-none">by Ahmed Alaa</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="btn py-1 px-2 text-xs"
            aria-label="Quick Search"
          >
            <Search size={13} className="text-steel" />
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="btn py-1 px-2 text-xs"
            aria-label="Open navigation menu"
          >
            <Menu size={15} />
          </button>
        </div>
      </div>

      {/* Mobile Slide-in Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fade-in">
          <div
            className="fixed inset-0 bg-ink/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-64 max-w-[80vw] bg-panel border-r border-line h-full shadow-2xl animate-drawer-in">
            {navContent(true)}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <nav
        aria-label="Main"
        className={clsx(
          "hidden md:flex shrink-0 border-r border-line bg-panel flex-col transition-all duration-300 sticky top-0 h-screen",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {navContent(false)}
      </nav>
    </>
  );
}
