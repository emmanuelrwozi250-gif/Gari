'use client';

import { useEffect, useState } from 'react';

const FALLBACK_FEED = [
  "Amina K. just booked a Toyota RAV4 in Gasabo · 4 min ago",
  "David N. received a 5★ review for his Land Cruiser V8 · 1 hour ago",
  "3 cars booked in Musanze this week 🦍 · 2 hours ago",
  "Jean-Pierre earned RWF 225,000 this week · Today",
  "Kalisa E. just booked a Mitsubishi Pajero for a safari · 8 min ago",
  "Patrick M. completed a 5-day Akagera safari trip · 3 hours ago",
  "18 bookings made in the last 24 hours 🚗 · Just now",
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
