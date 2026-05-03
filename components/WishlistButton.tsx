'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';

interface Props {
  carId: string;
  className?: string;
}

export function WishlistButton({ carId, className = '' }: Props) {
  const { has, toggle } = useWishlist();
  const saved = has(carId);

  return (
    <button
      type="button"
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(carId);
      }}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
        saved
          ? 'bg-red-500 text-white shadow-md'
          : 'bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-500 hover:bg-white shadow'
      } ${className}`}
    >
      <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
    </button>
  );
}
