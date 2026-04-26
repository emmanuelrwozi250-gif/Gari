import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle, FileText, Users, Banknote, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Corporate & NGO Vehicle Rental Rwanda · Gari Business',
  description: 'Fleet rental solutions for companies, NGOs and government agencies in Rwanda. Monthly invoicing, team access controls, and dedicated account management. MTN MoMo & bank transfer.',
  alternates: { canonical: '/corporate' },
};

const FEATURES = [
  {
    icon: FileText,
    title: 'Monthly Invoiced Billing',
    desc: 'Consolidate all team bookings into one monthly invoice. No per-booking card payments — pay by bank transfer or mobile money at month-end.',
  },
  {
    icon: Users,
    title: 'Team Access Controls',
    desc: 'Add unlimited employees. Set per-person monthly limits and cost centres. Approve or restrict booking types by role.',
  },
  {
    icon: Banknote,
    title: 'PO Number & Cost Centres',
    desc: 'Attach a purchase order or cost centre code to every booking. Exported reports match your finance system exactly.',
  },
  {
    icon: Shield,
    title: 'Dedicated Account Manager',
    desc: 'A named Gari account manager available on WhatsApp and email for fleet queries, urgent bookings, and dispute resolution.',
  },
];

const TIERS = [
  {
    name: 'Business',
    monthly: 'RWF 0',
    note: 'No monthly fee',
    target: 'SMEs & startups (2–10 employees)',
    features: [
      'Up to 10 team members',
      'Monthly invoiced billing',
      'Basic spending reports',
      'Standard support',
    ],
    cta: 'Apply free',
    primary: false,
  },
  {
    name: 'Corporate',
    monthly: 'RWF 0',
    note: 'No monthly fee',
    target: 'Companies & NGOs (10–200 employees)',
    features: [
      'Unlimited team members',
      'Cost centre & PO tracking',
      'Advanced booking reports (CSV)',
      'Dedicated account manager',
      'Net-30 credit terms',
      'Custom approval workflows',
    ],
    cta: 'Apply now',
    primary: true,
  },
  {
    name: 'Government',
    monthly: 'Custom',
    note: 'Contact us',
    target: 'Ministries, agencies & parastatals',
    features: [
      'Everything in Corporate',
      'Procurement-compliant invoicing',
      'Multi-site fleet management',
      'SLA-backed vehicle availability',
      'MININFRA & RRA tax docs',
    ],
    cta: 'Contact us',
    primary: false,
  },
];

const LOGOS = [
  'UN Agencies', 'NGOs', 'Hotels', 'Mining & Construction', 'Embassies', 'Banks',
];

export default function CorporatePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Building2 className="w-4 h-4" /> Gari for Business
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Fleet rental for Rwanda&apos;s organisations
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            Give your team access to cars, trucks, buses and specialised vehicles — with one monthly invoice, full spend visibility, and zero per-booking friction.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/corporate/apply" className="btn-primary px-8 py-3.5 text-base">
              Apply for a business account <ArrowRight className="w-4 h-4 ml-1 inline-block" />
            </Link>
            <a
              href="https://wa.me/250788123000?text=Hi%2C%20I%27m%20interested%20in%20a%20Gari%20Business%20account"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-[#1ebe5d] transition-colors"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="bg-gray-50 dark:bg-gray-900 border-y border-border py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <span className="text-xs text-text-light font-medium uppercase tracking-wider">Trusted by</span>
          {LOGOS.map(l => (
            <span key={l} className="text-sm font-semibold text-text-secondary">{l}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-text-primary dark:text-white text-center mb-10">
          Everything your finance team needs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-6 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary dark:text-white mb-1">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="bg-gray-50 dark:bg-gray-900 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-text-primary dark:text-white text-center mb-10">
            Simple, transparent pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map(tier => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  tier.primary
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 relative'
                    : 'border-border bg-white dark:bg-gray-900'
                }`}
              >
                {tier.primary && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-extrabold text-text-primary dark:text-white text-xl">{tier.name}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">{tier.target}</p>
                </div>
                <div className="mb-1">
                  <span className="text-2xl font-extrabold text-text-primary dark:text-white">{tier.monthly}</span>
                  <span className="text-xs text-text-light ml-1">{tier.note}</span>
                </div>
                <p className="text-xs text-text-light mb-5">You only pay for bookings your team makes.</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {tier.cta === 'Contact us' ? (
                  <a
                    href="https://wa.me/250788123000?text=Hi%2C%20I%20need%20a%20Government%20account%20on%20Gari"
                    target="_blank" rel="noopener noreferrer"
                    className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                      tier.primary ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <Link
                    href="/corporate/apply"
                    className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                      tier.primary ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-text-primary dark:text-white mb-3">
          Ready to streamline your fleet spend?
        </h2>
        <p className="text-text-secondary mb-6">
          Applications are reviewed within 1 business day. Your account manager will contact you via WhatsApp to complete setup.
        </p>
        <Link href="/corporate/apply" className="btn-primary px-8 py-3.5 text-base">
          Apply for a business account <ArrowRight className="w-4 h-4 ml-1 inline-block" />
        </Link>
      </section>

    </div>
  );
}
