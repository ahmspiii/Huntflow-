"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Keyboard, X } from "lucide-react";

const shortcuts = [
  { keys: ["Ctrl", "K"], desc: "Open global search & command palette" },
  { keys: ["?"], desc: "Show keyboard shortcuts" },
  { keys: ["Esc"], desc: "Close active modal or palette" },
  { keys: ["g", "d"], desc: "Go to Dashboard" },
  { keys: ["g", "l"], desc: "Go to Labs" },
  { keys: ["g", "i"], desc: "Go to Investigations" },
  { keys: ["g", "m"], desc: "Go to Malware Samples" },
  { keys: ["g", "o"], desc: "Go to IOC Repository" },
  { keys: ["g", "c"], desc: "Go to ATT&CK Coverage" },
  { keys: ["g", "r"], desc: "Go to Detection Rules" },
];

export default function ShortcutsModal() {
  const [open, setOpen] = useState(false);
  const lastKeyRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditing =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (e.target as HTMLElement)?.isContentEditable;

      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      if (isEditing || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      const key = e.key.toLowerCase();
      if (lastKeyRef.current === "g") {
        lastKeyRef.current = null;
        if (timerRef.current) clearTimeout(timerRef.current);
        const routeMap: Record<string, string> = {
          d: "/",
          l: "/labs",
          i: "/investigations",
          m: "/malware",
          o: "/iocs",
          c: "/coverage",
          r: "/detections",
        };
        if (routeMap[key]) {
          e.preventDefault();
          router.push(routeMap[key]);
        }
        return;
      }

      if (key === "g") {
        lastKeyRef.current = "g";
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          lastKeyRef.current = null;
        }, 800);
      }
    };

    const onOpenCustom = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-shortcuts-modal", onOpenCustom);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-shortcuts-modal", onOpenCustom);
    };
  }, [open, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
      <div
        className="relative z-10 w-full max-w-md rounded-lg border border-line bg-panel p-5 shadow-2xl space-y-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line/40 pb-2.5">
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <Keyboard size={16} className="text-steel" />
            Keyboard Shortcuts
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted hover:text-text p-1 rounded hover:bg-raised"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="divide-y divide-line/40">
          {shortcuts.map((s) => (
            <div key={s.desc} className="py-2 flex items-center justify-between text-xs gap-4">
              <span className="text-muted">{s.desc}</span>
              <div className="flex items-center gap-1 shrink-0">
                {s.keys.map((k, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1">
                    <kbd className="font-mono text-[10px] font-semibold bg-raised border border-line px-1.5 py-0.5 rounded text-text">
                      {k}
                    </kbd>
                    {idx < s.keys.length - 1 && <span className="text-muted/60 text-[10px]">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
