import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Plane, MapPin, Star, Users, CheckCircle, Clock, Shield, Phone } from 'lucide-react';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { formatRWF } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { waLink, COMPANY } from '@/lib/config/company';

export const metadata: Metadata = {
  title: 'Airport Transfers in Rwanda · Gari',
  description: 'Professional airport transfers from Kigali International Airport (RIA). Fixed rates, verified drivers, executive and SUV vehicles. Book via WhatsApp.',
};

const FALLBACK = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80';

const TRANSFER_RATES = [
  { destination: 'Kigali City Centre', time: '30–45 min', price: 15000, icon: '🏙️' },
  { destination: 'Kigali Heights / Kimihurura', time: '20–30 min', price: 12000, icon: '🏬' },
  { destination: 'Musanze / Volcanoes', time: '2.5 hrs', price: 45000, icon: '🦍' },
  { destination: 'Rubavu / Gisenyi', time: '2.5 hrs', price: 65000, icon: '🌊' },
  { destination: 'Huye / Butare', time: '2 hrs', price: 55000, icon: '🎓' },
  { destination: 'Nyungwe Forest', time: '5 hrs', price: 75000, icon: '🌿' },
  { destination: 'Akagera National Park', time: '2.5 hrs', price: 70000, icon: '🐘' },
  { destination: 'Nyanza / Muhanga', time: '1.5 hrs', price: 35000, icon: '📍' },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Book via WhatsApp',
    body: 'Send us your flight details, destination, and passenger count. We confirm within 30 minutes.',
    icon: <Phone className="w-6 h-6 text-primary" />,
  },
  {
    step: '2',
    title: 'Driver confirmed',
    body: "Your driver's name, photo, and vehicle plate are sent to you 2 hours before arrival.",
    icon: <CheckCircle className="w-6 h-6 text-primary" />,
  },
  {
    step: '3',
    title: 'Meet at arrivals',
    body: 'Driver meets you in the arrivals hall with a name board. Flight-monitored — no extra charge for delays.',
    icon: <Plane className="w-6 h-6 text-primary" />,
  },
];

const GUARANTEES = [
  'Fixed rates — no surge pricing or hidden fees',
  'Flight-monitored arrival times',
  'Clean, air-conditioned vehicles',
  'Professional English-speaking drivers',
  'Free waiting: 45 min after landing',
  '24/7 WhatsApp support',
];

async function getTransferCars() {
  try {
    const dbCars = await prisma.car.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        type: { in: ['EXECUTIVE', 'LUXURY', 'SUV_4X4', 'SEDAN'] },
        driverAvailable: true,
      },
      include: { host: { select: { name: true, avatar: true } } },
      orderBy: [{ rating: 'desc' }, { totalTrips: 'desc' }],
      take: 6,
    });
    if (dbCars.length > 0) return dbCars;
  } catch {
    // fall through to demo data
  }
  return DEMO_RENTAL_CARS.filter(
    c => c.type === 'Executive' || c.type === 'Sedan' || c.type === 'SUV / 4x4'
  ).slice(0, 6);
}

export default async function AirportTransferPage() {
  const cars = await getTransferCars();
  const bookingWaLink = waLink(
    'Hi, I need an airport transfer from Kigali International Airport (RIA). Flight details: [FLIGHT NO / DATE / TIME]. Destination: [HOTEL / DISTRICT]. Passengers: [NO]. Please confirm availability and rate.'
  );

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      {/* Hero */}
      <section className="relative bg-dark-bg text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80"
            alt="Kigali International Airport"
            fill className="object-cover" priority
            onError={() => {}}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/60 to-dark-bg/90" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <Plane className="w-4 h-4" />
            Kigali International Airport (RIA)
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Airport Transfers in Rwanda —{' '}
            <span className="text-accent-yellow">Stress-Free</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Professional drivers, clean vehicles, fixed rates. No surge pricing.
            Flight-monitored pickups so you never wait.
          </p>
          <a
            href={bookingWaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors shadow-lg"
          >
            <Phone className="w-5 h-5" />
            Book via WhatsApp
          </a>
          <p className="text-sm text-gray-400 mt-3">Instant confirmation · 30-min response guaranteed</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">

        {/* Fixed Rates */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-2">
              Fixed Transfer Rates from RIA
            </h2>
            <p className="text-text-secondary text-sm">Prices are per vehicle, not per person. Standard saloon or SUV.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRANSFER_RATES.map(rate => (
              <div key={rate.destination} className="card p-5 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-3">{rate.icon}</div>
                <h3 className="font-bold text-text-primary dark:text-white text-sm mb-1">{rate.destination}</h3>
                <div className="flex items-center gap-1 text-xs text-text-secondary mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  {rate.time}
                </div>
                <div className="text-2xl font-extrabold text-primary">{formatRWF(rate.price)}</div>
                <a
                  href={waLink(`Hi, I need an airport transfer from RIA to ${rate.destination}. Please confirm availability.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center text-xs font-semibold text-primary border border-primary rounded-xl py-2 hover:bg-primary hover:text-white transition-colors"
                >
                  Book this route →
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-text-light mt-4">
            Need a custom route or multiple vehicles?{' '}
            <a href={bookingWaLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              WhatsApp us for a quote →
            </a>
          </p>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white text-center mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="card p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Step {step.step}</div>
                <h3 className="font-bold text-text-primary dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Guarantees */}
        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-primary flex-shrink-0" />
            <h2 className="text-xl font-extrabold text-text-primary dark:text-white">Gari Transfer Guarantee</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {GUARANTEES.map(g => (
              <div key={g} className="flex items-center gap-3 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                {g}
              </div>
            ))}
          </div>
        </section>

        {/* Fleet */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">Our Transfer Fleet</h2>
              <p className="text-sm text-text-secondary mt-1">
                Executive sedans, SUVs, and minibuses — all with professional drivers
              </p>
            </div>
            <Link href="/search?driver=true&type=EXECUTIVE" className="text-sm text-primary font-semibold hover:underline hidden sm:block">
              See all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((car) => {
              const photos = (car as any).photos ?? (car as any).images ?? [];
              const img = photos[0] ?? FALLBACK;
              const rating = (car as any).rating ?? 0;
              const pricePerDay = (car as any).pricePerDay ?? 0;
              const seats = (car as any).seats ?? 5;
              const carId = (car as any).id;
              return (
                <Link
                  key={carId}
                  href={`/cars/${carId}`}
                  className="card overflow-hidden hover:shadow-lg transition-shadow group block"
                >
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={img}
                      alt={`${(car as any).make} ${(car as any).model}`}
                      fill className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc(50vw - 24px), 320px"
                      quality={70}
                      onError={(e) => { e.currentTarget.src = FALLBACK; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <span className="bg-purple-600/90 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        🧑‍✈️ Driver included
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-text-primary dark:text-white text-sm">
                          {(car as any).year} {(car as any).make} {(car as any).model}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{(car as any).district}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{seats} seats</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-primary font-bold text-sm">{formatRWF(pricePerDay)}</div>
                        <div className="text-xs text-text-light">/day</div>
                      </div>
                    </div>
                    {rating > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-accent-yellow font-semibold">
                        <Star className="w-3.5 h-3.5 fill-accent-yellow" /> {rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* CTA banner */}
        <section className="bg-dark-bg text-white rounded-2xl p-10 text-center">
          <Plane className="w-10 h-10 text-accent-yellow mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold mb-2">Ready to book your transfer?</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
            Send your flight number and destination — we'll handle the rest.
            Confirmation in under 30 minutes.
          </p>
          <a
            href={bookingWaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors"
          >
            <Phone className="w-5 h-5" />
            WhatsApp: {COMPANY.phone}
          </a>
        </section>

      </div>
    </div>
  );
}
