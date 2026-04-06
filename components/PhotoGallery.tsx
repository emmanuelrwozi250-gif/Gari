'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Expand, Grid3X3 } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  carName: string;
}

const FALLBACK = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

function safePhoto(url: string) {
  return url?.startsWith('http') ? url : FALLBACK;
}

export function PhotoGallery({ photos, carName }: PhotoGalleryProps) {
  const displayPhotos = photos.length > 0 ? photos : [FALLBACK];
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const prev = useCallback(() => {
    setActiveIndex(i => (i - 1 + displayPhotos.length) % displayPhotos.length);
  }, [displayPhotos.length]);

  const next = useCallback(() => {
    setActiveIndex(i => (i + 1) % displayPhotos.length);
  }, [displayPhotos.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) delta < 0 ? next() : prev();
    touchStartX.current = null;
  };

  // Keyboard navigation for lightbox
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') closeLightbox();
  }, [prev, next]);

  return (
    <>
      {/* Grid */}
      <div className="card overflow-hidden relative group">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {displayPhotos.slice(0, 4).map((photo, i) => (
            <div
              key={i}
              className={`relative overflow-hidden cursor-pointer ${i === 0 ? 'md:row-span-2 h-64 md:h-80' : 'h-40'}`}
              onClick={() => openLightbox(i)}
            >
              <Image
                src={safePhoto(photo)}
                alt={`${carName} photo ${i + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={i === 0}
              />
              {/* Show "+N more" overlay on last visible photo */}
              {i === 3 && displayPhotos.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+{displayPhotos.length - 4} more</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View all button */}
        <button
          onClick={() => openLightbox(0)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-text-primary dark:text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-white dark:hover:bg-gray-900 transition-colors"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          All {displayPhotos.length} photos
        </button>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
          role="dialog"
          aria-modal
          tabIndex={0}
          onKeyDown={onKeyDown}
          autoFocus
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium opacity-70">
              {activeIndex + 1} / {displayPhotos.length}
            </span>
            <span className="font-semibold">{carName}</span>
            <button onClick={closeLightbox} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main image */}
          <div
            className="flex-1 relative flex items-center justify-center px-12"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative w-full h-full max-w-4xl mx-auto">
              <Image
                src={safePhoto(displayPhotos[activeIndex])}
                alt={`${carName} photo ${activeIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Prev / Next */}
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/25 rounded-full transition-colors text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/25 rounded-full transition-colors text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
            {displayPhotos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all ${
                  i === activeIndex ? 'ring-2 ring-primary scale-110' : 'opacity-50 hover:opacity-80'
                }`}
              >
                <Image
                  src={safePhoto(photo)}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
