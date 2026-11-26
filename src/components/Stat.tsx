import { LucideIcon } from "lucide-react";
import Link from "next/link";

export default function Stat({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  href?: string;
}) {
  const content = (
    <div className="panel p-3.5 hover:border-steel/40 transition-colors group">
      <div className="flex items-center justify-between text-muted text-xs mb-1.5">
        <span>{label}</span>
        {Icon && <Icon size={14} className="text-muted group-hover:text-steel transition-colors" />}
      </div>
      <div className="text-2xl font-bold tabular-nums text-text">{value}</div>
    </div>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}
