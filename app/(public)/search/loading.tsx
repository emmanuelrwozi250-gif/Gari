import { CarCardSkeleton } from '@/components/CarCard';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="skeleton h-8 w-48 mb-2" />
      <div className="skeleton h-4 w-32 mb-6" />
      {/* Car grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CarCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
