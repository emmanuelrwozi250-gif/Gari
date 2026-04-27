export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-xl" />
      <div className="skeleton h-48 rounded-xl" />
    </div>
  );
}
