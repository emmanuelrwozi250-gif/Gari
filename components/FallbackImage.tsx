'use client';

import { useState } from 'react';
import Image from 'next/image';

interface FallbackImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  fallback?: string;
}

const DEFAULT_FALLBACK = '/images/car-placeholder.svg';

export function FallbackImage({ src, alt, fill, className, sizes, quality, fallback }: FallbackImageProps) {
  const resolvedFallback = fallback ?? DEFAULT_FALLBACK;
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      quality={quality}
      onError={() => setImgSrc(resolvedFallback)}
      unoptimized={imgSrc === resolvedFallback}
    />
  );
}
