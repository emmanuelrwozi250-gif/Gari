export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="skeleton h-8 w-56" />
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      {/* Chart */}
      <div className="skeleton h-48 rounded-xl" />
      {/* Bookings */}
      <div className="skeleton h-96 rounded-xl" />
    </div>
  );
}
