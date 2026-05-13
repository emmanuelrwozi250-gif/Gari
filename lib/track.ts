/**
 * Client-side + server-side event tracking helpers for behaviour-based recommendations.
 * Fire-and-forget — never blocks the UI.
 */

export type EventType =
  | 'car_view'
  | 'car_click'
  | 'search'
  | 'collection_view'
  | 'booking_start'
  | 'booking_complete';

export interface TrackPayload {
  eventType: EventType;
  carId?: string;
  carType?: string;
  district?: string;
  priceRange?: string;
  collection?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Returns or creates a persistent anonymous session ID stored in a cookie.
 * Works client-side only.
 */
function getSessionId(): string {
  if (typeof document === 'undefined') return 'ssr';

  const key = 'gari_sid';
  const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
  if (match) return decodeURIComponent(match[1]);

  // Generate a new session ID
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);

  // 30-day session cookie
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${key}=${encodeURIComponent(id)}; expires=${expires}; path=/; SameSite=Lax`;
  return id;
}

/**
 * Fire-and-forget client-side event tracking.
 * Errors are silently swallowed — tracking must never break the UI.
 */
export function trackEvent(payload: TrackPayload): void {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();

  // Use sendBeacon when available (survives page navigation)
  const body = JSON.stringify({ ...payload, sessionId });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/events/track', new Blob([body], { type: 'application/json' }));
  } else {
    fetch('/api/events/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}
