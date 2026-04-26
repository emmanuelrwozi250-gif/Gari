'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

interface FallbackImageProps extends Omit<ImageProps, 'onError'> {
  fallback?: string;
}

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

export function FallbackImage({ fallback = DEFAULT_FALLBACK, src, ...props }: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <Image
      {...props}
      src={imgSrc}
      onError={() => setImgSrc(fallback)}
    />
  );
}
