"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="panel p-6 text-center max-w-sm">
        <div className="inline-flex p-3 rounded bg-danger/10 mb-3">
          <AlertTriangle size={32} className="text-danger" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted mb-4">{error.message}</p>
        <button className="btn-primary" onClick={reset}>
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    </div>
  );
}
