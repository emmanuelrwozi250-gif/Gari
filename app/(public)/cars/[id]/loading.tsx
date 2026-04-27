export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      {/* Photo gallery skeleton */}
      <div className="skeleton h-80 rounded-2xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-32 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
        </div>
        {/* Right: booking widget */}
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    </div>
  );
}
