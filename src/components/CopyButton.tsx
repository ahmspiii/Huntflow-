"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ text, compact = false }: { text: string; compact?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      title={ok ? "Copied" : "Copy to clipboard"}
      className={compact ? "btn-ghost p-1 text-muted hover:text-steel" : "btn-ghost py-1 px-2 text-xs"}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? (
        <><Check size={12} className="text-confirmed" />{!compact && " Copied!"}</>
      ) : (
        <><Copy size={12} />{!compact && " Copy"}</>
      )}
    </button>
  );
}
