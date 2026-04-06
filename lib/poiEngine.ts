/**
 * POI Direction & Relevance Engine
 *
 * Calculates:
 * - Bearing from user to POI
 * - Relative direction (ahead / left / right / behind)
 * - Relevance score (distance × category weight × time-of-day)
 * - Audio announcement text
 */

export type RelativeDirection = 'ahead' | 'right' | 'left' | 'behind';

/** Haversine distance in metres */
export function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Bearing from point A to point B (degrees, 0 = North, clockwise) */
export function getBearing(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const lat1 = fromLat * Math.PI / 180;
  const lat2 = toLat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

/**
 * Get direction of POI relative to user's heading.
 * heading: device compass bearing (0–360, 0 = North)
 * bearing: absolute bearing from user to POI
 */
export function getRelativeDirection(bearing: number, heading: number): RelativeDirection {
  // If heading is null/NaN (user stationary), treat everything as 'ahead'
  if (!isFinite(heading)) return 'ahead';
  const relative = ((bearing - heading) + 360) % 360;
  if (relative < 45 || relative >= 315) return 'ahead';
  if (relative >= 45 && relative < 135) return 'right';
  if (relative >= 135 && relative < 225) return 'behind';
  return 'left';
}

/** Time-of-day category weight multiplier */
function timeWeight(category: string): number {
  const hour = new Date().getHours();
  const weights: Record<string, (h: number) => number> = {
    food:       h => (h >= 6 && h < 10) ? 1.5 : (h >= 11 && h < 14) ? 1.8 : (h >= 18 && h < 22) ? 1.6 : 1.0,
    hotel:      _ => 1.0,
    healthcare: _ => 1.3, // always relevant
    landmark:   _ => 1.1,
    religious:  h => (h === 7 || h === 9 || h === 11 || h === 17 || h === 19) ? 1.4 : 1.0,
    transport:  _ => 1.2,
    shopping:   h => (h >= 9 && h < 20) ? 1.2 : 0.6,
    finance:    h => (h >= 8 && h < 17) ? 1.3 : 0.7,
  };
  return (weights[category] ?? (() => 1.0))(hour);
}

export interface ScoredPOI {
  osmId: string;
  name: string;
  category: string;
  subCategory: string;
  lat: number;
  lng: number;
  tags: Record<string, string>;
  isSponsored?: boolean;
  audioScript?: string | null;
  distance: number;
  bearing: number;
  direction: RelativeDirection;
  relevanceScore: number;
}

export function scorePOIs(
  pois: { osmId: string; name: string; category: string; subCategory: string; lat: number; lng: number; tags: any; isSponsored?: boolean; audioScript?: string | null; sponsorPriority?: number }[],
  userLat: number,
  userLng: number,
  heading: number,       // compass degrees; NaN if stationary
  enabledCategories: string[],
  radiusMetres: number
): ScoredPOI[] {
  const scored: ScoredPOI[] = [];

  for (const poi of pois) {
    if (!enabledCategories.includes(poi.category)) continue;

    const distance = distanceMetres(userLat, userLng, poi.lat, poi.lng);
    if (distance > radiusMetres) continue;

    const bearing = getBearing(userLat, userLng, poi.lat, poi.lng);
    const direction = getRelativeDirection(bearing, heading);

    // Skip POIs behind the user (unless stationary)
    if (direction === 'behind' && isFinite(heading)) continue;

    // Relevance: closer + time-relevant + ahead bonus + sponsored boost
    const distScore = 1 - distance / radiusMetres;           // 0–1 (closer = higher)
    const dirBonus  = direction === 'ahead' ? 1.3 : 1.0;     // ahead POIs preferred
    const timeMult  = timeWeight(poi.category);
    const sponsorBonus = (poi.isSponsored ? (poi.sponsorPriority ?? 1) * 0.5 : 0);

    const relevanceScore = (distScore * dirBonus * timeMult) + sponsorBonus;

    scored.push({ ...poi, distance, bearing, direction, relevanceScore });
  }

  // Sort by relevance descending
  return scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/** Generate natural audio announcement text */
export function buildAnnouncementText(poi: ScoredPOI): string {
  // Sponsored override
  if (poi.audioScript) return poi.audioScript;

  const distStr = poi.distance < 50
    ? 'right here'
    : poi.distance < 100
    ? `${Math.round(poi.distance / 10) * 10} metres away`
    : `about ${Math.round(poi.distance / 50) * 50} metres away`;

  const dirStr: Record<RelativeDirection, string> = {
    ahead:  'Ahead of you',
    right:  'On your right',
    left:   'On your left',
    behind: 'Behind you',
  };

  const subMeta: Record<string, string> = {
    cafe: 'café', restaurant: 'restaurant', bar: 'bar', hotel: 'hotel',
    guest_house: 'guest house', hospital: 'hospital', pharmacy: 'pharmacy',
    place_of_worship: 'place of worship', attraction: 'attraction',
    historic: 'historic site', fuel: 'fuel station', supermarket: 'supermarket',
    bank: 'bank', atm: 'ATM',
  };
  const typeLabel = subMeta[poi.subCategory] || poi.category;

  return `${dirStr[poi.direction]}: ${poi.name}, a ${typeLabel}, ${distStr}.`;
}
