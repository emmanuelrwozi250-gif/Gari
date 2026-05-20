import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — Gari',
  description: "Common questions about renting and hosting on Gari — Rwanda's trusted car rental platform.",
  openGraph: {
    title: 'FAQ | Gari Rwanda Car Rental',
    description: "Common questions about renting and hosting on Gari — Rwanda's trusted B2B2C car rental platform.",
    url: 'https://gari-africa.com/faq',
    siteName: 'Gari',
    locale: 'en_RW',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'FAQ | Gari Rwanda Car Rental',
    description: "Common questions about renting on Gari — Rwanda's RURA-compliant car rental platform.",
  },
};

const RENTER_FAQS = [
  {
    q: 'Is VAT included in the price I see?',
    a: 'Prices shown on listings exclude VAT. Your full breakdown — ' +
       'including 18% VAT required by Rwanda Revenue Authority — appears ' +
       'in the booking widget when you select dates. Gari is VAT-registered ' +
       'and remits VAT directly to RRA. An official EBM receipt ' +
       '(Irisiti ya EBM) is issued for every confirmed booking.',
  },
  {
    q: 'How do I book a car?',
    a: 'Browse cars on the search page, pick your dates, and choose a pickup location. Select your payment method (MTN MoMo, Airtel Money, or Card) and confirm. For non-instant booking cars, the host has 24 hours to accept.',
  },
  {
    q: 'What ID do I need to rent?',
    a: 'A valid Rwandan National ID (Ikarita y\'Ubwenegihugu) or a valid passport. NIDA identity verification is required before your first booking — this takes under 2 minutes.',
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Yes. Cancellations within 24 hours of booking are fully refunded. After that, you receive a 50% refund if cancelled before the trip starts. No refund is issued once the trip is active.',
  },
  {
    q: 'Is insurance included in every rental?',
    a: 'Yes. Every Gari booking automatically includes Basic Insurance covering vehicle damage and third-party liability up to RWF 5,000,000. Your insurance certificate is available in your dashboard after payment.',
  },
  {
    q: 'What if the car looks different from the photos?',
    a: 'Contact Gari support immediately via WhatsApp (+250 788 123 000) before you start driving. We will investigate and, if the discrepancy is significant, arrange a full refund or a replacement vehicle.',
  },
  {
    q: 'What happens if I have an accident involving a third party?',
    a: 'Stop the vehicle in a safe location and call the Rwanda National Police (113). Do not admit liability at the scene. Photograph the vehicles and any damage. Report to Gari via WhatsApp within 48 hours with photos and the police reference number. Basic Insurance covers third-party liability up to RWF 5,000,000. Gari Protect holders have extended coverage.',
  },
  {
    q: 'What is the fuel policy?',
    a: 'All Gari vehicles are provided with a full tank of fuel. Return the car with a full tank to avoid a refuelling charge (typically RWF 15,000 service fee plus the cost of fuel at current pump prices). Confirm with your host at pickup — some hosts offer flexible fuel arrangements.',
  },
  {
    q: 'Are there mileage limits?',
    a: 'Most Gari rentals have unlimited mileage within Rwanda. If a host sets a daily mileage cap it will be shown on the listing under "Rules". Cross-border travel to neighbouring countries (Uganda, DRC, Tanzania, Burundi) requires prior written approval from the host and may incur additional fees.',
  },
];

const HOST_FAQS = [
  {
    q: 'How do I list my car on Gari?',
    a: 'Go to /host/new and complete the 4-step wizard: vehicle details, photos, pricing & location, and rules. Submit for review — listings go live within 1-2 business days after our team verifies your photos and documents.',
  },
  {
    q: 'When do I receive my earnings?',
    a: 'Your earnings (rental amount minus the 12% Gari platform fee) are available to withdraw after each completed trip. Minimum payout is RWF 1,000. Payouts are sent via MTN MoMo or your preferred method.',
  },
  {
    q: 'What if a renter damages my car?',
    a: 'Report the damage within 48 hours via your host dashboard using the "Report Damage" button. Gari holds the security deposit until the dispute is reviewed. Provide photos and an estimated repair cost for faster resolution.',
  },
  {
    q: 'Can I set my own rental price?',
    a: 'Absolutely. You control your daily rate. Gari provides AI-powered pricing suggestions based on local demand, seasonality, and comparable vehicles — but you are always in charge of your own price.',
  },
  {
    q: 'What is the Gari platform fee?',
    a: 'Gari charges a 12% platform fee deducted from your rental earnings. This covers insurance, payment processing, customer support, and platform maintenance. Tips from renters are paid 100% to you — no deductions.',
  },
  {
    q: 'What taxes apply to my rental income?',
    a: 'All rental transactions on Gari are subject to 18% VAT (TVA) as required by Rwanda Revenue Authority (RRA). Gari collects this VAT from renters on your behalf and remits it directly to RRA. An EBM receipt is issued for every booking. Your earnings shown in your dashboard are already net of VAT remittance — you do not need to register for or manage VAT separately.',
  },
];

const OPERATOR_FAQS = [
  {
    q: 'Do I need a RURA commercial license to list on Gari?',
    a: 'Yes. Gari is a B2B2C platform exclusively for commercially licensed operators. Your vehicle must hold a valid RURA commercial vehicle permit (TM plates). Private vehicles are not permitted under Rwanda\'s rental transport regulations.',
  },
  {
    q: 'What documents do I need to submit?',
    a: 'You need: (1) RURA commercial vehicle license / TM registration certificate, (2) valid third-party or comprehensive insurance certificate, (3) current vehicle inspection certificate (contrôle technique from an approved RTDA centre), and (4) your Rwanda National ID (NIDA) or business registration number for company fleets.',
  },
  {
    q: 'How long does the verification process take?',
    a: 'Our compliance team reviews submitted documents within 24 hours on business days. Once approved, your listing goes live immediately. We may request additional documentation for commercial fleet operators with multiple vehicles.',
  },
  {
    q: 'What is the boost feature and how does it work?',
    a: 'Boost gives your listings priority placement in search results for RWF 14,500 per vehicle per month. Boosted vehicles appear above standard listings and receive a \'⭐ Featured\' badge. You can activate boost from your Operator Dashboard.',
  },
  {
    q: 'When do I receive my payout?',
    a: 'Payouts are sent to your MTN MoMo or Airtel Money within 24 hours of trip completion, provided there are no active disputes or damage claims. Payouts are net of the 12% platform fee and any applicable VAT remitted to RRA.',
  },
  {
    q: 'What commission does Gari charge operators?',
    a: 'Gari charges a 12% platform fee on each booking\'s rental value. This covers payment processing, customer support, insurance coordination, and the NIDA verification system. There are no listing fees — you only pay when you earn.',
  },
  {
    q: 'Do my drivers need a professional driver permit?',
    a: 'Yes. Any driver you assign through Gari — whether for a self-drive vehicle handover or as a supplied chauffeur — must hold a valid Rwanda professional driver\'s permit (permis de conduire professionnel) issued by RTDA in addition to their standard driving licence. This is a legal requirement under Rwanda\'s transport regulations for commercial vehicle operators. Gari may request proof of your drivers\' professional permits during the compliance review.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between gap-4 cursor-pointer p-5 font-semibold text-text-primary dark:text-white list-none select-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
        {q}
        <span className="text-primary text-xl flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
      </summary>
      <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
        {a}
      </div>
    </details>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-text-primary dark:text-white mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-text-secondary">
            Everything you need to know about renting and hosting on Gari.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">For Renters</h2>
          <div className="space-y-3">
            {RENTER_FAQS.map(item => <FAQItem key={item.q} {...item} />)}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">For Hosts</h2>
          <div className="space-y-3">
            {HOST_FAQS.map(item => <FAQItem key={item.q} {...item} />)}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">🏛️ For Operators</h2>
          <div className="space-y-3">
            {OPERATOR_FAQS.map(item => <FAQItem key={item.q} {...item} />)}
          </div>
        </section>

        <div className="mt-12 card p-6 text-center">
          <p className="text-text-secondary mb-4">Still have questions?</p>
          <a
            href="https://wa.me/250788123000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3"
          >
            Chat with us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
