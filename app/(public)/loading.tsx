export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[70vh] bg-gray-200 dark:bg-gray-800" />

      {/* Stats row */}
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>

      {/* Car grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
