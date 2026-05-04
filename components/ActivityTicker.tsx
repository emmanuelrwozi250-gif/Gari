'use client';

import { useEffect, useState } from 'react';

const FALLBACK_FEED = [
  "✓ Every host is NIDA-verified before listing a car",
  "📋 An EBM receipt (RRA) is issued for every booking",
  "🔒 Security deposits held safely by Gari — released 48 h after return",
  "⚡ Instant booking available on select vehicles — no waiting for approval",
  "🌍 English-speaking drivers available for international guests",
  "🛡️ Basic insurance included in every rental at no extra cost",
  "💳 Pay with MTN MoMo, Airtel Money, or card — fully secure",
];

export function ActivityTicker() {
  const [feed, setFeed] = useState<string[]>(FALLBACK_FEED);
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Fetch live events once on mount; fall back to static list on any error
  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.ok ? r.json() : null)
      .then((data: { events?: string[] } | null) => {
        if (data?.events && data.events.length > 0) {
          setFeed(data.events);
          setIndex(0);
        }
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % feed.length);
        setFade(true);
      }, 400);
    }, 6000);
    return () => clearInterval(timer);
  }, [feed.length]);

  return (
    <div className="w-full bg-primary/5 dark:bg-primary/10 border-y border-primary/10 py-2 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
        <p
          className="text-xs text-text-secondary dark:text-gray-400 truncate transition-opacity duration-400"
          style={{ opacity: fade ? 1 : 0 }}
          aria-live="polite"
          aria-label="Live activity feed"
        >
          {feed[index]}
        </p>
      </div>
    </div>
  );
}
