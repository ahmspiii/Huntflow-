"use client";
import { useState } from "react";
import { Printer, Copy, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReportActions({
  investigationId,
  markdownContent,
}: {
  investigationId: string;
  markdownContent: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Link href={`/investigations/${investigationId}`} className="btn text-xs">
        <ArrowLeft size={13} /> Back to Investigation
      </Link>
      <button type="button" onClick={handleCopy} className="btn text-xs">
        {copied ? <Check size={13} className="text-confirmed" /> : <Copy size={13} />}
        {copied ? "Copied Markdown" : "Copy Markdown"}
      </button>
      <button type="button" onClick={handlePrint} className="btn-primary text-xs">
        <Printer size={13} /> Print / Save as PDF
      </button>
    </div>
  );
}
