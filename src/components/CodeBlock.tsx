"use client";
import CopyButton from "./CopyButton";

type CodeBlockProps = {
  code: string;
  language?: string;
};

export default function CodeBlock({ code, language }: CodeBlockProps) {
  if (!code) return null;

  const lines = code.trim().split("\n");

  // Simple token styling for common query keywords (SPL, KQL, Sigma)
  const formatLine = (line: string) => {
    // Sigma YAML keys (e.g., title:, logsource:, detection:)
    const yamlKeyMatch = line.match(/^([a-zA-Z_-]+):(.*)$/);
    if (yamlKeyMatch) {
      return (
        <>
          <span className="text-steel font-medium">{yamlKeyMatch[1]}:</span>
          <span className="text-text/90">{yamlKeyMatch[2]}</span>
        </>
      );
    }

    // Common KQL/SPL keywords
    const keywords = [
      "index=", "sourcetype=", "source=", "host=", "where", "search", "table", "stats", "eval", "dedup",
      "project", "summarize", "extend", "take", "limit", "distinct", "join", "union", "render",
      "by", "count()", "bin", "dcount"
    ];

    let highlighted = line;
    return <span className="text-text/90">{line}</span>;
  };

  return (
    <div className="panel overflow-hidden my-2 border-line/60">
      <div className="flex items-center justify-between px-3 py-1.5 bg-raised/70 border-b border-line/40 text-xs">
        <span className="font-mono text-muted text-[11px] font-medium uppercase tracking-wider">
          {language || "code"}
        </span>
        <CopyButton text={code} />
      </div>
      <div className="overflow-x-auto p-3 font-mono text-xs bg-ink/70 leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="hover:bg-raised/30">
                <td className="pr-4 text-muted/40 text-right select-none w-8 text-[11px] align-top">
                  {i + 1}
                </td>
                <td className="whitespace-pre break-all">
                  {formatLine(l)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
