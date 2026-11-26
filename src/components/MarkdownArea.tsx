"use client";
import { useState } from "react";
import { Eye, Edit3 } from "lucide-react";

type MarkdownAreaProps = {
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
};

function renderSimpleMarkdown(md: string) {
  const lines = md.split("\n");
  const blocks: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  const formatInline = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((p, idx) => {
      if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
        return (
          <code key={idx} className="font-mono text-[11px] bg-raised px-1 py-0.5 rounded border border-line/60 text-steel">
            {p.slice(1, -1)}
          </code>
        );
      }
      if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
        return <strong key={idx} className="font-semibold text-text">{p.slice(2, -2)}</strong>;
      }
      return p;
    });
  };

  lines.forEach((line, i) => {
    if (line.trim().startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        inCode = false;
        blocks.push(
          <pre key={`code-${i}`} className="bg-ink border border-line rounded p-2.5 my-2 overflow-x-auto font-mono text-[11px] text-text/90">
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (line.startsWith("### ")) {
      blocks.push(<h4 key={i} className="text-xs font-bold text-text mt-2.5 mb-1">{formatInline(line.slice(4))}</h4>);
    } else if (line.startsWith("## ")) {
      blocks.push(<h3 key={i} className="text-sm font-bold text-text mt-3 mb-1 border-b border-line/40 pb-1">{formatInline(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      blocks.push(<h2 key={i} className="text-base font-bold text-text mt-3 mb-1.5">{formatInline(line.slice(2))}</h2>);
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      blocks.push(
        <div key={i} className="flex items-start gap-2 text-xs text-text/90 pl-2 my-0.5">
          <span className="text-steel mt-1 text-[10px]">•</span>
          <span>{formatInline(line.trim().slice(2))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      blocks.push(<div key={i} className="h-2" />);
    } else {
      blocks.push(<p key={i} className="text-xs text-text/90 leading-relaxed">{formatInline(line)}</p>);
    }
  });

  if (inCode && codeLines.length) {
    blocks.push(
      <pre key="code-tail" className="bg-ink border border-line rounded p-2.5 my-2 overflow-x-auto font-mono text-[11px] text-text/90">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return blocks;
}

export default function MarkdownArea({ name, defaultValue = "", rows = 3, placeholder }: MarkdownAreaProps) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 transition-colors ${
            !preview ? "bg-steel/15 text-steel font-medium" : "text-muted hover:text-text"
          }`}
        >
          <Edit3 size={11} /> Write
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 transition-colors ${
            preview ? "bg-steel/15 text-steel font-medium" : "text-muted hover:text-text"
          }`}
        >
          <Eye size={11} /> Preview
        </button>
      </div>

      <textarea
        className={`input ${preview ? "hidden" : ""}`}
        rows={rows}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />

      {preview && (
        <div className="min-h-[76px] rounded border border-line bg-ink/60 px-3 py-2.5 animate-fade-in">
          {value.trim() ? (
            renderSimpleMarkdown(value)
          ) : (
            <span className="text-xs text-muted/60 italic">Nothing to preview yet.</span>
          )}
        </div>
      )}
    </div>
  );
}
