import Link from 'next/link';
import type { Collection } from '@/lib/collections';

interface Props {
  collection: Collection;
  /** Show a smaller compact card variant */
  compact?: boolean;
}

export function CollectionCard({ collection, compact = false }: Props) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group block rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      <div className={`relative overflow-hidden ${compact ? 'aspect-[4/3]' : 'aspect-video'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={collection.heroImage}
          alt={collection.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <div className="text-2xl mb-1">{collection.emoji}</div>
          <h3 className="text-white font-bold text-lg leading-tight">{collection.title}</h3>
          {!compact && (
            <p className="text-gray-300 text-xs mt-1 line-clamp-2">{collection.description}</p>
          )}
          <div className="flex gap-1 mt-2 flex-wrap">
            {collection.highlights.map((h) => (
              <span
                key={h}
                className="text-[10px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
