import { LucideIcon, Inbox } from "lucide-react";
import Link from "next/link";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing recorded yet",
  description,
  action,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="panel p-8 text-center">
      <div className="inline-flex p-3 rounded-lg bg-raised mb-3">
        <Icon size={24} className="text-muted" />
      </div>
      <h3 className="text-sm font-semibold text-text mb-1">{title}</h3>
      {description && <p className="text-xs text-muted max-w-sm mx-auto">{description}</p>}
      {action && (
        <div className="mt-3">
          <Link href={action.href} className="btn-primary text-xs">
            {action.label}
          </Link>
        </div>
      )}
    </div>
  );
}
