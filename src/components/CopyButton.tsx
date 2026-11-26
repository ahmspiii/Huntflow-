"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost py-1 px-2 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? <><Check size={12} className="text-confirmed" /> Copied!</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}
