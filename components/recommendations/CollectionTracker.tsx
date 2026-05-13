'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/track';

interface Props {
  slug: string;
}

/** Invisible client component that fires a collection_view event on mount. */
export function CollectionTracker({ slug }: Props) {
  useEffect(() => {
    trackEvent({ eventType: 'collection_view', collection: slug });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
