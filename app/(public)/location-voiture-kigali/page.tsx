import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { CarCard } from '@/components/CarCard';
import { DEMO_RENTAL_CARS } from '@/lib/demo-data';
import { MapPin, Star, Shield, CheckCircle, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Location de Voiture à Kigali, Rwanda — Dès 35 000 FRW/jour · Gari',
  description:
    'Louez une voiture vérifiée à Kigali dès 35 000 FRW/jour. Économique, SUV, executive et minibus. Paiement MTN MoMo. Avec ou sans chauffeur. Confirmation instantanée.',
  keywords: ['location voiture Kigali', 'louer une voiture Kigali', 'voiture de location Rwanda', 'location auto Kigali', 'gari location Rwanda'],
  openGraph: {
    title: 'Location de Voiture Kigali — Gari',
    description: 'Voitures vérifiées à Kigali dès 35 000 FRW/jour. Paiement MoMo. Réservation instantanée.',
    type: 'website',
  },
};

const KIGALI_DISTRICTS = ['gasabo', 'kicukiro', 'nyarugenge'];

function demoToCard(c: (typeof DEMO_RENTAL_CARS)[number]) {
  return {
    id: c.id, make: c.make, model: c.model, year: c.year, type: c.type,
    listingType: c.listingType, seats: c.seats, fuel: c.fuel,
    pricePerDay: c.pricePerDay, driverAvailable: c.drivingOption !== 'Self-Drive',
    photos: c.images, district: c.district, isVerified: c.hostVerified,
    rating: c.rating, totalTrips: c.reviewCount, hasAC: c.features.includes('Air Conditioning'),
    host: { name: c.hostName, avatar: c.hostAvatar },
  };
}

async function getKigaliCars() {
  try {
    const cars = await prisma.car.findMany({
      where: { isAvailable: true, district: { in: KIGALI_DISTRICTS } },
      include: { host: { select: { name: true, avatar: true, superhostSince: true } } },
      orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }],
      take: 9,
    });
    return cars;
  } catch { return []; }
}

const FAQ = [
  { q: 'Quel est le prix d\'une location de voiture à Kigali ?', a: 'La location de voiture à Kigali commence à 35 000 FRW par jour pour une économique. Les SUV coûtent généralement 70 000–100 000 FRW/jour. Les prix incluent l\'assurance de base. Ajoutez un chauffeur pour 12 000–25 000 FRW/jour.' },
  { q: 'Puis-je payer avec MTN MoMo ?', a: 'Oui — Gari accepte MTN MoMo, Airtel Money et les paiements par carte. Payez instantanément lors de la réservation. Aucune transaction en espèces requise.' },
  { q: 'Ai-je besoin d\'un permis de conduire pour louer une voiture à Kigali ?', a: 'Oui, un permis de conduire valide est requis pour la conduite autonome. Les permis internationaux sont acceptés. Vous pouvez également ajouter un chauffeur local vérifié à votre réservation.' },
  { q: 'Puis-je obtenir une livraison à l\'aéroport international de Kigali ?', a: 'De nombreux hôtes Gari proposent un service de prise en charge à l\'aéroport KIA. Sélectionnez "Aéroport de Kigali (KIA)" comme lieu de prise en charge lors de la réservation.' },
  { q: 'Les voitures sont-elles assurées ?', a: 'Toutes les annonces Gari vérifiées incluent une assurance responsabilité civile de base. Vous pouvez ajouter Gari Protect (couverture complète jusqu\'à 2 000 000 FRW) lors de la réservation pour 5 000 FRW/jour.' },
];

export default async function LocationVoitureKigaliPage() {
  const dbCars = await getKigaliCars();
  const cars: ReturnType<typeof demoToCard>[] =
    dbCars.length > 0 ? (dbCars as unknown as ReturnType<typeof demoToCard>[]) :
    DEMO_RENTAL_CARS.filter(c => KIGALI_DISTRICTS.includes(c.district)).slice(0, 9).map(demoToCard);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Gari — Location de Voiture Kigali',
    description: 'La principale place de marché de location de voiture au Rwanda.',
    url: 'https://gari-nu.vercel.app/location-voiture-kigali',
    address: { '@type': 'PostalAddress', addressLocality: 'Kigali', addressCountry: 'RW' },
    priceRange: '35 000 FRW – 400 000 FRW par jour',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
        <section className="relative bg-dark-bg text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <Image src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1600&q=60" alt="Location voiture Kigali" fill className="object-cover" priority sizes="100vw" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
              <MapPin className="w-4 h-4 text-accent-yellow" /> Kigali, Rwanda
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
              Location de Voiture à Kigali<br />
              <span className="text-accent-yellow">Dès 35 000 FRW/jour</span>
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Voitures vérifiées dans tout Kigali. Paiement MTN MoMo ou carte. Avec ou sans chauffeur professionnel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/search?district=gasabo" className="btn-primary px-8 py-3 text-base font-bold">Voir les voitures à Kigali</Link>
              <Link href="/search?district=gasabo&driver=true" className="flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/25 transition-colors text-base">
                Avec Chauffeur
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 border-b border-border py-5">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { icon: Shield, label: 'Hôtes vérifiés NIDA' },
                { icon: CheckCircle, label: 'Inspectés & assurés' },
                { icon: Star, label: '4.8★ note moyenne' },
                { icon: Phone, label: 'Support WhatsApp 24/7' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-text-secondary">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-text-primary dark:text-white">Disponibles à Kigali</h2>
              <p className="text-text-secondary text-sm mt-1">{cars.length}+ voitures vérifiées · Réservation instantanée</p>
            </div>
            <Link href="/search?district=gasabo" className="text-sm text-primary font-semibold hover:underline">Tout voir →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((car: ReturnType<typeof demoToCard>) => <CarCard key={car.id} car={car} />)}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-6">Questions Fréquentes</h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="card p-5">
                <h3 className="font-bold text-text-primary dark:text-white text-sm mb-2">{q}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
