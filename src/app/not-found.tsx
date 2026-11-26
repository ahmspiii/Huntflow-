import Link from "next/link";
import { SearchX, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="inline-flex p-3 rounded bg-raised mb-4">
          <SearchX size={48} className="text-muted" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
        <p className="text-lg text-muted mb-6">Page not found</p>
        <p className="text-sm text-muted/60 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-primary">
          <Home size={14} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
