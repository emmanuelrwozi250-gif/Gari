/**
 * Default center coordinates for all 30 Rwanda districts.
 * Used as fallback when a car has no explicit lat/lng set.
 */
export const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  gasabo:      { lat: -1.8978, lng: 30.1128 },
  kicukiro:    { lat: -1.9706, lng: 30.1044 },
  nyarugenge:  { lat: -1.9441, lng: 30.0619 },
  bugesera:    { lat: -2.2000, lng: 30.1333 },
  gatsibo:     { lat: -1.5833, lng: 30.4667 },
  kayonza:     { lat: -1.8833, lng: 30.6500 },
  kirehe:      { lat: -2.1167, lng: 30.6833 },
  ngoma:       { lat: -2.1500, lng: 30.4667 },
  nyagatare:   { lat: -1.2981, lng: 30.3253 },
  rwamagana:   { lat: -1.9500, lng: 30.4333 },
  burera:      { lat: -1.4700, lng: 29.8500 },
  gakenke:     { lat: -1.6833, lng: 29.7833 },
  gicumbi:     { lat: -1.5762, lng: 30.0643 },
  musanze:     { lat: -1.4995, lng: 29.6327 },
  rulindo:     { lat: -1.7167, lng: 30.0333 },
  gisagara:    { lat: -2.6167, lng: 29.8333 },
  huye:        { lat: -2.5960, lng: 29.7390 },
  kamonyi:     { lat: -2.0833, lng: 29.8833 },
  muhanga:     { lat: -2.0833, lng: 29.7500 },
  nyamagabe:   { lat: -2.4667, lng: 29.4833 },
  nyamasheke:  { lat: -2.3167, lng: 29.1333 },
  nyanza:      { lat: -2.3500, lng: 29.7500 },
  nyaruguru:   { lat: -2.7500, lng: 29.5833 },
  ruhango:     { lat: -2.2333, lng: 29.7833 },
  karongi:     { lat: -2.0667, lng: 29.3667 },
  ngororero:   { lat: -1.8833, lng: 29.5333 },
  nyabihu:     { lat: -1.6667, lng: 29.5000 },
  nyamasheke2: { lat: -2.3167, lng: 29.1333 },
  rubavu:      { lat: -1.6752, lng: 29.3400 },
  rusizi:      { lat: -2.4833, lng: 28.9000 },
  rutsiro:     { lat: -1.9500, lng: 29.4167 },
};

export function getDistrictCoords(district: string): { lat: number; lng: number } | null {
  const key = district.toLowerCase().replace(/\s+/g, '');
  return DISTRICT_COORDS[key] || null;
}

/** Haversine formula — distance in km between two coordinates */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Bounding box for a center + radius (km) */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}
