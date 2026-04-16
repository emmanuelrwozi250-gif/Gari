export function HostProfileSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        {/* Avatar */}
        <div className="skeleton w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
        {[0, 1, 2].map(i => (
          <div key={i} className="space-y-1.5 text-center">
            <div className="skeleton h-5 w-8 mx-auto" />
            <div className="skeleton h-3 w-12 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
