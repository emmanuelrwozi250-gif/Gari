/**
 * Overpass API client — fetches POIs from OpenStreetMap.
 * Free, no API key required, excellent coverage in Rwanda/Africa.
 */

export interface OverpassPOI {
  osmId: string;
  name: string;
  category: string;
  subCategory: string;
  lat: number;
  lng: number;
  tags: Record<string, string>;
}

// Map OSM tags → our category system
const CATEGORY_MAP: { tag: string; value: RegExp; category: string; subCategory: string }[] = [
  { tag: 'amenity', value: /^(restaurant|fast_food|food_court)$/, category: 'food', subCategory: 'restaurant' },
  { tag: 'amenity', value: /^(cafe|coffee_shop)$/, category: 'food', subCategory: 'cafe' },
  { tag: 'amenity', value: /^(bar|pub)$/, category: 'food', subCategory: 'bar' },
  { tag: 'tourism', value: /^(hotel|motel)$/, category: 'hotel', subCategory: 'hotel' },
  { tag: 'tourism', value: /^(hostel|guest_house)$/, category: 'hotel', subCategory: 'guest_house' },
  { tag: 'tourism', value: /^(attraction|museum|viewpoint|monument|artwork|gallery)$/, category: 'landmark', subCategory: 'attraction' },
  { tag: 'historic', value: /.*/, category: 'landmark', subCategory: 'historic' },
  { tag: 'amenity', value: /^place_of_worship$/, category: 'religious', subCategory: 'place_of_worship' },
  { tag: 'amenity', value: /^(hospital|clinic)$/, category: 'healthcare', subCategory: 'hospital' },
  { tag: 'amenity', value: /^(pharmacy|doctors)$/, category: 'healthcare', subCategory: 'pharmacy' },
  { tag: 'amenity', value: /^(fuel|parking)$/, category: 'transport', subCategory: 'fuel' },
  { tag: 'shop', value: /^(supermarket|mall|department_store)$/, category: 'shopping', subCategory: 'supermarket' },
  { tag: 'amenity', value: /^bank$/, category: 'finance', subCategory: 'bank' },
  { tag: 'amenity', value: /^atm$/, category: 'finance', subCategory: 'atm' },
];

function classifyNode(tags: Record<string, string>): { category: string; subCategory: string } | null {
  for (const rule of CATEGORY_MAP) {
    const val = tags[rule.tag];
    if (val && rule.value.test(val)) {
      return { category: rule.category, subCategory: rule.subCategory };
    }
  }
  return null;
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export async function fetchPOIsFromOverpass(
  lat: number,
  lng: number,
  radiusMeters: number = 200
): Promise<OverpassPOI[]> {
  // Overpass QL query — fetches nodes with relevant tags within radius
  const query = `
[out:json][timeout:10];
(
  node["amenity"~"restaurant|cafe|fast_food|bar|pub|hospital|clinic|pharmacy|doctors|bank|atm|fuel|place_of_worship|school|university"](around:${radiusMeters},${lat},${lng});
  node["tourism"~"hotel|motel|hostel|guest_house|attraction|museum|viewpoint|monument"](around:${radiusMeters},${lat},${lng});
  node["shop"~"supermarket|mall|department_store|convenience"](around:${radiusMeters},${lat},${lng});
  node["historic"](around:${radiusMeters},${lat},${lng});
);
out body;`;

  // Try endpoints with fallback
  let lastError: Error | null = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const results: OverpassPOI[] = [];

      for (const element of (data.elements || [])) {
        if (!element.lat || !element.lon) continue;

        const tags: Record<string, string> = element.tags || {};
        const name = tags.name || tags['name:en'] || tags['name:rw'];
        if (!name) continue; // skip unnamed POIs

        const classification = classifyNode(tags);
        if (!classification) continue;

        results.push({
          osmId: String(element.id),
          name,
          category: classification.category,
          subCategory: classification.subCategory,
          lat: element.lat,
          lng: element.lon,
          tags,
        });
      }

      return results;
    } catch (err) {
      lastError = err as Error;
      continue;
    }
  }

  console.warn('[overpass] All endpoints failed:', lastError?.message);
  return [];
}

/** Category → emoji + readable label */
export const CATEGORY_META: Record<string, { emoji: string; label: string; audioPrefix: string }> = {
  food:       { emoji: '🍽️', label: 'Restaurant',  audioPrefix: 'a restaurant' },
  hotel:      { emoji: '🏨', label: 'Hotel',       audioPrefix: 'a hotel' },
  landmark:   { emoji: '🏛️', label: 'Landmark',    audioPrefix: 'a landmark' },
  religious:  { emoji: '⛪', label: 'Worship',     audioPrefix: 'a place of worship' },
  healthcare: { emoji: '🏥', label: 'Healthcare',  audioPrefix: 'a healthcare facility' },
  transport:  { emoji: '⛽', label: 'Transport',   audioPrefix: 'a fuel station' },
  shopping:   { emoji: '🛒', label: 'Shopping',    audioPrefix: 'a shop' },
  finance:    { emoji: '🏦', label: 'Bank/ATM',    audioPrefix: 'a bank' },
};

export function getSubCategoryMeta(subCategory: string): { emoji: string; audioPrefix: string } {
  const map: Record<string, { emoji: string; audioPrefix: string }> = {
    restaurant:       { emoji: '🍽️', audioPrefix: 'a restaurant' },
    cafe:             { emoji: '☕', audioPrefix: 'a café' },
    bar:              { emoji: '🍺', audioPrefix: 'a bar' },
    hotel:            { emoji: '🏨', audioPrefix: 'a hotel' },
    guest_house:      { emoji: '🏡', audioPrefix: 'a guest house' },
    hospital:         { emoji: '🏥', audioPrefix: 'a hospital' },
    pharmacy:         { emoji: '💊', audioPrefix: 'a pharmacy' },
    attraction:       { emoji: '🏛️', audioPrefix: 'a tourist attraction' },
    historic:         { emoji: '🏰', audioPrefix: 'a historic site' },
    place_of_worship: { emoji: '⛪', audioPrefix: 'a place of worship' },
    fuel:             { emoji: '⛽', audioPrefix: 'a fuel station' },
    supermarket:      { emoji: '🛒', audioPrefix: 'a supermarket' },
    bank:             { emoji: '🏦', audioPrefix: 'a bank' },
    atm:              { emoji: '💳', audioPrefix: 'an ATM' },
  };
  return map[subCategory] || { emoji: '📍', audioPrefix: 'a point of interest' };
}
