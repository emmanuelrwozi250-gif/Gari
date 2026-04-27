import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Globe, Car, Shield, MapPin, CheckCircle, ChevronRight,
  Phone, FileText, AlertTriangle, Navigation,
} from 'lucide-react';
import { COMPANY, waLink } from '@/lib/config/company';

export const metadata: Metadata = {
  title: 'Car Rental for International Visitors — Gari Rwanda',
  description: 'Rent a car in Rwanda as a tourist or expat. Passport verification, card payments, English-speaking hosts, airport pickup. All vehicles insured.',
  openGraph: {
    title: 'Rent a Car in Rwanda — Gari International',
    description: 'Rwanda\'s trusted car rental for tourists & expats. NIDA-verified hosts, card payments, airport transfers.',
    url: 'https://gari.rw/international',
    images: [{ url: 'https://gari.rw/og?title=Car+Rental+for+Visitors&sub=Rwanda\'s+most+trusted+platform&type=intl', width: 1200, height: 630 }],
  },
};

const ROUTES = [
  { from: 'Kigali (RIA)', to: 'Musanze / Volcanoes NP', km: 110, hrs: 2.5, notes: 'Gorilla trekking — book 6 months ahead' },
  { from: 'Kigali', to: 'Akagera National Park', km: 140, hrs: 2.5, notes: 'Game drives available year-round' },
  { from: 'Kigali', to: 'Nyungwe Forest', km: 230, hrs: 4.5, notes: 'Chimpanzee tracking & canopy walk' },
  { from: 'Kigali', to: 'Lake Kivu / Rubavu', km: 160, hrs: 3, notes: 'Scenic drives, kayaking & beaches' },
  { from: 'Kigali', to: 'Huye (Butare)', km: 130, hrs: 2.5, notes: 'National Museum & genocide memorial' },
  { from: 'Kigali', to: 'Gisenyi / Congo border', km: 165, hrs: 3, notes: 'Border crossing (cross-border terms apply)' },
];

const FAQS = [
  {
    q: 'Do I need an International Driving Permit (IDP)?',
    a: 'Yes — if you are driving yourself (self-drive). Rwanda traffic law requires foreign nationals to carry both their home driving licence and a valid IDP. IDPs can be obtained from your national motoring authority (e.g. AAA in the US, AA in the UK) before you travel. If you book with a driver, an IDP is not required.',
  },
  {
    q: 'Can I pay by credit or debit card?',
    a: 'Yes. Gari accepts Visa and Mastercard for international renters, in addition to MTN MoMo and Airtel Money. Prices are in Rwandan Francs (RWF); your card issuer converts at their current rate.',
  },
  {
    q: 'What ID do I need at pickup?',
    a: 'Bring your passport, your home driving licence, and your IDP (for self-drive). The host will verify your passport details match your Gari account.',
  },
  {
    q: 'Can I drive to Uganda, Tanzania, or the DRC?',
    a: 'Cross-border travel requires prior written approval from Gari and the host. Additional insurance documentation may be required. Most bookings are Rwanda-only by default.',
  },
  {
    q: 'Are the hosts English-speaking?',
    a: 'We flag hosts who speak English on their listings. When booking, look for the 🌍 International Friendly badge. You can also request an English-speaking host via our WhatsApp concierge.',
  },
  {
    q: 'What if I have an accident or breakdown?',
    a: 'Contact Gari immediately via WhatsApp. All rentals include basic insurance. For Gari Protect subscribers, collision damage up to RWF 2,000,000 is covered. The host provides a roadside assistance contact at pickup.',
  },
  {
    q: 'Is there an airport pickup option?',
    a: 'Yes — look for the ✈️ Airport Pickup badge on listings. Alternatively, book an airport transfer via our dedicated airport transfer service.',
  },
  {
    q: 'How does passport verification work?',
    a: 'When you register as an international renter, you upload a photo of your passport. Our team reviews it within 2 hours during business hours. Once verified, you can book any available vehicle.',
  },
];

export default function InternationalPage() {
  const conciergeLink = waLink("Hi, I'm an international visitor looking to rent a car in Rwanda. Can you help?");
  const bookLink = waLink("Hi, I need help booking a car as an international visitor to Rwanda.");

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Globe className="w-4 h-4" /> International Visitors Welcome
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Explore Rwanda Your Way
          </h1>
          <p className="text-xl text-white/85 mb-8 max-w-2xl mx-auto">
            Verified hosts · Card payments · English-speaking drivers · Airport pickup · All vehicles insured
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/search?intl=true" className="bg-white text-primary font-bold px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
              <Car className="w-5 h-5" /> Browse cars
            </Link>
            <a href={conciergeLink} target="_blank" rel="noopener noreferrer"
              className="bg-white/20 border border-white/40 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-white/30 transition-colors inline-flex items-center gap-2">
              <Phone className="w-5 h-5" /> WhatsApp concierge
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-extrabold text-text-primary dark:text-white text-center mb-10">How it works for visitors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { step: '1', icon: Globe, title: 'Register & verify', desc: 'Create account, upload passport photo. Verified in under 2 hours.' },
            { step: '2', icon: Car, title: 'Browse & book', desc: 'Filter by International Friendly hosts. Pay by card or MoMo.' },
            { step: '3', icon: MapPin, title: 'Meet your host', desc: 'Airport or hotel pickup. Host verifies IDP + passport.' },
            { step: '4', icon: Navigation, title: 'Drive Rwanda', desc: 'Insured, 24/7 WhatsApp support, return to agreed location.' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 font-extrabold text-lg">{step}</div>
              <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <h3 className="font-bold text-text-primary dark:text-white mb-1">{title}</h3>
              <p className="text-sm text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IDP Gate */}
      <section id="driving" className="py-10 px-4 bg-amber-50 dark:bg-amber-900/10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-extrabold text-amber-800 dark:text-amber-200 mb-2">
                International Driving Permit (IDP) — required for self-drive
              </h2>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed mb-4">
                Rwandan traffic law requires all foreign nationals driving (not using a driver) to carry a valid IDP alongside their home driving licence. Without an IDP, you cannot legally self-drive — and your insurance coverage may be void.
              </p>
              <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" /> Obtain your IDP from your national motoring authority <strong>before you fly</strong>.</div>
                <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" /> Valid IDPs are issued by AAA (USA), AA (UK/Ireland), ADAC (Germany), RAC, CAA, etc.</div>
                <div className="flex items-start gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" /> If you prefer not to get an IDP, book with a driver — our licensed hosts handle all driving.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-14 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-2">Popular routes from Kigali</h2>
        <p className="text-text-secondary mb-8">All distances from Kigali International Airport (RIA).</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {ROUTES.map(r => (
            <div key={r.to} className="card p-5 flex items-start gap-4">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="font-bold text-text-primary dark:text-white">{r.to}</p>
                  <span className="text-xs text-text-light whitespace-nowrap">{r.km}km · {r.hrs}h</span>
                </div>
                <p className="text-xs text-text-secondary">{r.notes}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/airport-transfer" className="btn-secondary inline-flex items-center gap-2">
            ✈️ Book an airport transfer instead <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-10 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white text-center mb-8">Why visitors trust Gari</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: 'Passport-verified hosts', desc: 'Every host is NIDA-verified. We know who owns every vehicle.' },
              { icon: FileText, title: 'EBM receipts', desc: 'RRA-compliant receipts issued after every trip — useful for business expense claims.' },
              { icon: Car, title: 'Insured rentals', desc: 'All vehicles have third-party insurance. Gari Protect adds collision damage cover.' },
              { icon: Globe, title: 'English-speaking hosts', desc: 'Filter for International Friendly hosts who speak English (some also French).' },
              { icon: MapPin, title: 'Airport pickup', desc: 'Many hosts offer pickup from Kigali International Airport — no need for a taxi.' },
              { icon: Phone, title: '24/7 WhatsApp support', desc: 'Our team is available on WhatsApp for emergencies, directions, and help.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5">
                <Icon className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-bold text-text-primary dark:text-white mb-1">{title}</h3>
                <p className="text-sm text-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-4 max-w-3xl mx-auto">
        <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-8">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQS.map(faq => (
            <div key={faq.q} className="card p-5">
              <h3 className="font-bold text-text-primary dark:text-white mb-2">{faq.q}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white text-center mb-8">Visitors love Gari</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                name: 'Sarah K.', country: '🇺🇸 United States', stars: 5,
                review: 'Smooth from start to finish. Uploaded my passport, got verified in an hour, and the host met me at the airport with a clean Prado. Highly recommend for gorilla trekking.',
              },
              {
                name: 'Thomas B.', country: '🇩🇪 Germany', stars: 5,
                review: 'I was worried about driving with just my German licence but the IDP instructions were clear. Host spoke excellent English, car was great on the mountain roads to Musanze.',
              },
            ].map(t => (
              <div key={t.name} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-text-primary dark:text-white">{t.name}</p>
                    <p className="text-xs text-text-secondary">{t.country}</p>
                  </div>
                  <div className="ml-auto text-yellow-400 text-sm">{'★'.repeat(t.stars)}</div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">&ldquo;{t.review}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-3">Ready to explore Rwanda?</h2>
          <p className="text-text-secondary mb-6">Create your account, upload your passport, and book in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?intent=foreign" className="btn-primary py-3.5 px-8 text-base font-bold inline-flex items-center gap-2">
              <Globe className="w-5 h-5" /> Create account
            </Link>
            <a href={bookLink} target="_blank" rel="noopener noreferrer"
              className="btn-secondary py-3.5 px-8 text-base font-bold inline-flex items-center gap-2">
              <Phone className="w-5 h-5" /> Book via WhatsApp
            </a>
          </div>
          <p className="text-xs text-text-light mt-4">
            Questions? Email <a href="mailto:hello@gari.rw" className="text-primary hover:underline">{COMPANY.email}</a>
          </p>
        </div>
      </section>

    </div>
  );
}
