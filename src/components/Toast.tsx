"use client";
import { useEffect, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

export default function Toast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const notice = searchParams.get("notice");
  const error = searchParams.get("error");

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (notice) {
      setMessage({ text: notice, type: "success" });
      setVisible(true);
    } else if (error) {
      setMessage({ text: error, type: "error" });
      setVisible(true);
    } else {
      return;
    }

    const cleanParams = new URLSearchParams(searchParams.toString());
    cleanParams.delete("notice");
    cleanParams.delete("error");
    const qs = cleanParams.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });

    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [notice, error, pathname, router, searchParams]);

  if (!visible || !message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-slide-up">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-xl text-xs font-medium ${
          message.type === "success"
            ? "bg-panel border-confirmed/50 text-text"
            : "bg-panel border-danger/60 text-text"
        }`}
      >
        {message.type === "success" ? (
          <CheckCircle2 size={15} className="text-confirmed shrink-0" />
        ) : (
          <AlertTriangle size={15} className="text-danger shrink-0" />
        )}
        <span className="flex-1">{message.text}</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-muted hover:text-text p-0.5"
          aria-label="Dismiss notification"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
