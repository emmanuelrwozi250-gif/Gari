export interface Collection {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  heroImage: string;
  searchParams: { type?: string; district?: string; driver?: string; seats?: string };
  highlights: [string, string, string];
}

export const COLLECTIONS: Collection[] = [
  {
    slug: 'gorilla-trek',
    title: 'Gorilla Trek',
    emoji: '🦍',
    description: 'Reliable 4WD vehicles for the Volcanoes National Park gorilla permit roads. Leave Kigali at 5 AM and reach the trailhead in comfort.',
    heroImage: 'https://images.pexels.com/photos/2376090/pexels-photo-2376090.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: { type: 'suv-4x4' },
    highlights: ['4WD essential for mountain roads', 'Verified SUV fleet', 'From RWF 80k/day'],
  },
  {
    slug: 'lake-kivu',
    title: 'Lake Kivu Weekend',
    emoji: '🌊',
    description: 'Economy to luxury cars for Rubavu, Karongi, and the scenic Kivu shore road. Perfect for a weekend escape from Kigali.',
    heroImage: 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: {},
    highlights: ['Any car fits the Kivu shore drive', 'Scenic 2.5 hr journey', 'From RWF 35k/day'],
  },
  {
    slug: 'kigali-business',
    title: 'Kigali Business Class',
    emoji: '💼',
    description: 'Executive and luxury cars with professional drivers for corporate travel, airport runs, and client meetings.',
    heroImage: 'https://images.pexels.com/photos/10224502/pexels-photo-10224502.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: { type: 'executive' },
    highlights: ['Professional chauffeurs', 'Airport-to-meeting service', 'From RWF 120k/day'],
  },
  {
    slug: 'national-parks',
    title: 'National Parks Explorer',
    emoji: '🐘',
    description: 'Safari-ready 4x4s for Akagera, Nyungwe, and Gishwati-Mukura. Get deep into the wilderness where paved roads end.',
    heroImage: 'https://images.pexels.com/photos/19758141/pexels-photo-19758141.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: { type: 'suv-4x4' },
    highlights: ['Bush-ready vehicles', 'Land Cruiser & Prado fleet', 'From RWF 85k/day'],
  },
  {
    slug: 'family-road-trip',
    title: 'Family Road Trip',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Spacious minibuses and 7-seater SUVs for family adventures across Rwanda. Enough room for everyone — and the luggage.',
    heroImage: 'https://images.pexels.com/photos/2674052/pexels-photo-2674052.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: { seats: '5' },
    highlights: ['7+ seats available', 'Child seat add-ons', 'From RWF 50k/day'],
  },
  {
    slug: 'luxury',
    title: 'Luxury & Premium',
    emoji: '✨',
    description: 'Mercedes, Land Cruisers, and top-tier SUVs for weddings, special occasions, and when only the best will do.',
    heroImage: 'https://images.pexels.com/photos/9927972/pexels-photo-9927972.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: { type: 'luxury' },
    highlights: ['Premium brands only', 'Weddings & events', 'From RWF 150k/day'],
  },
];

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find(c => c.slug === slug);
}
