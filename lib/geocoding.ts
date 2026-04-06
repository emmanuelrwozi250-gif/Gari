import { RWANDA_DISTRICTS, District } from './districts';

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'GariApp/1.0 (car rental Rwanda)' } }
    );
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();
    // Prefer a shorter display: neighbourhood/suburb, city, country
    const addr = data.address;
    if (addr) {
      const parts = [
        addr.neighbourhood || addr.suburb || addr.quarter,
        addr.city || addr.town || addr.village || addr.county,
        addr.country,
      ].filter(Boolean);
      if (parts.length) return parts.join(', ');
    }
    return data.display_name || 'Unknown location';
  } catch {
    return 'Unknown location';
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestDistrict(lat: number, lng: number): District {
  return RWANDA_DISTRICTS.reduce(
    (nearest, district) => {
      const d = haversine(lat, lng, district.lat, district.lng);
      return d < nearest.dist ? { district, dist: d } : nearest;
    },
    { district: RWANDA_DISTRICTS[0], dist: Infinity }
  ).district;
}
