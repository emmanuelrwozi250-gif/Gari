export function ReviewSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      {/* Reviewer row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3.5 w-28" />
          <div className="skeleton h-3 w-20" />
        </div>
        {/* Star row */}
        <div className="skeleton h-3.5 w-16 flex-shrink-0" />
      </div>
      {/* Comment lines */}
      <div className="space-y-2">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-5/6" />
        <div className="skeleton h-3.5 w-3/4" />
      </div>
    </div>
  );
}
