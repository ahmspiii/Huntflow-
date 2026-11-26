"use client";
import { useState } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

type ConfirmButtonProps = {
  label?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  variant?: "danger" | "ghost";
  size?: "sm" | "xs";
  onConfirm?: () => void;
  formAction?: any;
};

export default function ConfirmButton({
  label = "Delete",
  confirmTitle = "Confirm Deletion",
  confirmMessage = "Are you sure you want to delete this record? This action cannot be undone.",
  variant = "danger",
  size = "xs",
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "danger"
            ? "btn-danger text-xs inline-flex items-center gap-1.5"
            : "btn-ghost py-0.5 px-1.5 text-danger hover:text-danger text-[11px]"
        }
      >
        <Trash2 size={size === "xs" ? 12 : 13} />
        <span>{label}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div
            className="relative z-10 w-full max-w-sm rounded-lg border border-danger/40 bg-panel p-5 shadow-2xl space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-danger/15 text-danger shrink-0 mt-0.5">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-text">{confirmTitle}</h3>
                <p className="text-xs text-muted leading-relaxed">{confirmMessage}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/40">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-danger text-xs font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
