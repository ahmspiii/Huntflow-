"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Shield, LayoutDashboard, FlaskConical,
  Library, ShieldCheck, Grid3x3, BookOpen, Plus,
  CornerDownLeft, ArrowUp, ArrowDown, X, ShieldAlert, Bug, Hash, FileCode,
} from "lucide-react";

type SearchResult = {
  category: string;
  title: string;
  subtitle: string;
  href: string;
  badge: string;
};

const defaultNav = [
  { category: "Navigation", title: "Threat Hunting Dashboard", subtitle: "Main metrics & overview", href: "/", icon: LayoutDashboard },
  { category: "Navigation", title: "ATT&CK Explorer", subtitle: "Browse MITRE enterprise techniques", href: "/mitre", icon: Shield },
  { category: "Navigation", title: "Coverage Matrix", subtitle: "Heatmap & detection coverage", href: "/coverage", icon: Grid3x3 },
  { category: "Analysis", title: "Coverage Gap Analysis", subtitle: "Unmonitored critical techniques & query recommendations", href: "/coverage/gaps", icon: ShieldAlert },
  { category: "Navigation", title: "Investigations", subtitle: "Browse and manage threat cases", href: "/investigations", icon: Search },
  { category: "Navigation", title: "Malware Samples", subtitle: "Static, behavioral & C2 analysis", href: "/malware", icon: Bug },
  { category: "Navigation", title: "IOC Repository", subtitle: "Global threat indicators & correlation", href: "/iocs", icon: Hash },
  { category: "Actions", title: "New Investigation", subtitle: "Start documenting a new incident", href: "/investigations/new", icon: Plus },
  { category: "Actions", title: "New Malware Sample", subtitle: "Catalog a new malware specimen", href: "/malware/new", icon: Plus },
  { category: "Navigation", title: "Query Library", subtitle: "SPL, KQL, EQL hunting queries", href: "/queries", icon: Library },
  { category: "Navigation", title: "Detection Rules", subtitle: "Sigma & YARA detection rules", href: "/detections", icon: ShieldCheck },
  { category: "Navigation", title: "Knowledge Base", subtitle: "Universal full-text search", href: "/knowledge", icon: BookOpen },
  { category: "Navigation", title: "Documentation", subtitle: "Platform workflow & API guide", href: "/docs", icon: FileCode },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut (Ctrl+K / Cmd+K) and custom event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    const handleCustomOpen = () => setOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Active items list (either search results or default shortcuts)
  const currentItems = query.trim()
    ? results
    : defaultNav.map((n) => ({
        category: n.category,
        title: n.title,
        subtitle: n.subtitle,
        href: n.href,
        badge: n.category,
      }));

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  // Keyboard navigation inside the palette
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < currentItems.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : currentItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentItems[selectedIndex]) {
        handleSelect(currentItems[selectedIndex].href);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="fixed inset-0 -z-10"
        onClick={() => setOpen(false)}
      />

      <div className="w-full max-w-xl rounded-lg border border-line bg-panel shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-slide-up">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-line/60 bg-raised/30">
          <Search size={16} className="text-steel shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a technique ID (e.g. T1059), query, investigation, or page..."
            className="w-full bg-transparent text-xs text-text placeholder:text-muted/60 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted hover:text-text p-1"
            >
              <X size={13} />
            </button>
          ) : (
            <span className="text-[10px] font-mono text-muted bg-raised px-1.5 py-0.5 rounded border border-line">
              ESC
            </span>
          )}
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto flex-1 divide-y divide-line/30 p-1.5">
          {loading ? (
            <div className="p-6 text-center text-xs text-muted">
              Searching HuntFlow repository...
            </div>
          ) : currentItems.length > 0 ? (
            currentItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.href}-${idx}`}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                    isSelected ? "bg-steel/15 text-steel" : "hover:bg-raised text-text"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-medium truncate">{item.title}</div>
                    <div className="text-[11px] text-muted truncate">{item.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-line/60 text-muted">
                      {item.badge}
                    </span>
                    {isSelected && <CornerDownLeft size={12} className="text-steel" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-muted">
              No matching results found for &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-3 py-2 bg-raised/40 border-t border-line/40 flex items-center justify-between text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUp size={11} /><ArrowDown size={11} /> Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft size={11} /> Select
            </span>
            <span>ESC to close</span>
          </div>
          <span className="text-[10px] text-muted/70">Spotlight Search</span>
        </div>
      </div>
    </div>
  );
}
