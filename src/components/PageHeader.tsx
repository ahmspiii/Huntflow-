import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LucideIcon } from "lucide-react";

type Crumb = { label: string; href?: string };

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line/50 pb-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted mb-2">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} className="text-muted/60" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-steel transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-text/70">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={20} className="text-steel shrink-0" />}
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
