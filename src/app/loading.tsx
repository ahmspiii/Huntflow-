export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-64 bg-raised rounded-lg animate-pulse" />
        <div className="h-4 w-48 bg-raised/60 rounded animate-pulse" />
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="panel p-4 space-y-3">
            <div className="h-8 w-16 bg-raised rounded animate-pulse" />
            <div className="h-3 w-24 bg-raised/60 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-4 h-64 bg-raised/30 animate-pulse rounded-lg" />
        <div className="panel p-4 h-64 bg-raised/30 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
