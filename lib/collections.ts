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
    description: "The mountain gorillas don't come to you. Go to them in a bush-ready 4WD, verified for the unpaved Musanze roads that most city rentals can't handle.",
    heroImage: 'https://images.pexels.com/photos/2376090/pexels-photo-2376090.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: { type: 'suv-4x4' },
    highlights: ['4WD essential for mountain roads', 'Verified SUV fleet', 'From RWF 94,400/day incl. VAT'],
  },
  {
    slug: 'lake-kivu',
    title: 'Lake Kivu Weekend',
    emoji: '🌊',
    description: 'Three hours from Kigali, the lake turns the road into a postcard. Any car fits — the drive itself is the experience.',
    heroImage: 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: {},
    highlights: ['Any car fits the Kivu shore drive', 'Scenic 2.5 hr journey', 'From RWF 41,300/day incl. VAT'],
  },
  {
    slug: 'kigali-business',
    title: 'Kigali Business Class',
    emoji: '💼',
    description: "Your client shouldn't wait in a taxi queue. Executive cars with professional chauffeurs for airport runs, KCC meetings, and corporate transfers.",
    heroImage: 'https://images.pexels.com/photos/10224502/pexels-photo-10224502.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: { type: 'executive' },
    highlights: ['Professional chauffeurs', 'Airport-to-meeting service', 'From RWF 141,600/day incl. VAT'],
  },
  {
    slug: 'national-parks',
    title: 'National Parks Explorer',
    emoji: '🐘',
    description: 'After the tarmac ends, the wildlife begins. Safari-ready 4x4s for Akagera, Nyungwe, and Gishwati-Mukura — where paved roads are a memory.',
    heroImage: 'https://images.pexels.com/photos/19758141/pexels-photo-19758141.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: { type: 'suv-4x4' },
    highlights: ['Bush-ready vehicles', 'Land Cruiser & Prado fleet', 'From RWF 100,300/day incl. VAT'],
  },
  {
    slug: 'family-road-trip',
    title: 'Family Road Trip',
    emoji: '👨‍👩‍👧‍👦',
    description: "Rwanda is small enough to cross in a day and big enough to keep surprising you. Spacious 7-seaters for the whole family — and all the luggage.",
    heroImage: 'https://images.pexels.com/photos/2674052/pexels-photo-2674052.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: { seats: '5' },
    highlights: ['7+ seats available', 'Child seat add-ons', 'From RWF 59,000/day incl. VAT'],
  },
  {
    slug: 'luxury',
    title: 'Luxury & Premium',
    emoji: '✨',
    description: "One thing that doesn't happen on your wedding day: compromise. Mercedes, Land Cruisers, and top-tier SUVs for your most important occasions.",
    heroImage: 'https://images.pexels.com/photos/9927972/pexels-photo-9927972.jpeg?auto=compress&cs=tinysrgb&w=1200',
    searchParams: { type: 'executive' },
    highlights: ['Premium brands only', 'Weddings & events', 'From RWF 177,000/day incl. VAT'],
  },
];

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find(c => c.slug === slug);
}
