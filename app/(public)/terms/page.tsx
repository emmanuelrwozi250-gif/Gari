import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Gari',
  description: 'Gari Terms of Service — booking terms, cancellation policy, host and renter obligations, and governing law.',
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By creating an account or using the Gari platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform. Gari reserves the right to update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms.`,
  },
  {
    title: '2. The Gari Platform',
    body: `Gari operates an online marketplace connecting vehicle owners ("Hosts") with individuals seeking short-term vehicle rentals ("Renters"). Gari is not a party to the rental agreement between Host and Renter. Gari does not own any vehicles listed on the Platform. Gari facilitates the booking, payment, insurance, and dispute resolution processes as a service to both parties.`,
  },
  {
    title: '3. Booking & Payment',
    body: `Renters can request or instantly book vehicles listed on the Platform. All prices are displayed in Rwandan Francs (RWF). Gari charges a 10% platform fee on each booking, deducted from the Host's earnings. Payment methods include MTN MoMo, Airtel Money, and card payments via Stripe. All transactions are processed securely. A booking is only confirmed once payment is received and (for non-instant listings) the Host accepts the request.`,
  },
  {
    title: '4. Cancellation Policy',
    body: `Renters may cancel for a full refund within 24 hours of booking creation. Cancellations after 24 hours but before the trip starts receive a 50% refund. No refund is issued once the trip is active. If a Host cancels a confirmed booking, the Renter receives a 100% refund and the Host may receive a penalty on their account standing. If a Host does not respond within 24 hours, the booking is automatically rejected and the Renter is fully refunded.`,
  },
  {
    title: '5. Host Obligations',
    body: `Hosts must: (a) provide accurate vehicle information including photos, condition, and features; (b) ensure the vehicle is available and roadworthy at the confirmed pickup time; (c) be contactable by WhatsApp on the day of pickup; (d) comply with Rwandan motor vehicle laws; and (e) report any damage or issues to Gari within 24 hours of the return. Hosts must not list vehicles they do not own or have authority to list.`,
  },
  {
    title: '6. Renter Obligations',
    body: `Renters must: (a) hold a valid Rwandan driving permit or an internationally recognized driving license; (b) complete NIDA identity verification before their first booking; (c) return the vehicle at the agreed time and location in the same condition it was collected; (d) not sub-rent, lend, or transfer use of the vehicle to any third party; and (e) not transport illegal items or engage in illegal activities using the vehicle.`,
  },
  {
    title: '7. Security Deposit',
    body: `Some vehicles require a security deposit set by the Host. The deposit is held by Gari and released within 48 hours of the trip ending safely, unless a damage claim is raised. If the Host raises a damage claim within 24 hours of return, the deposit is held pending resolution of the dispute. Gari has final authority on deposit allocation decisions.`,
  },
  {
    title: '8. Disputes',
    body: `In the event of a dispute between Renter and Host, either party may raise a formal dispute through the Gari dashboard within 24 hours of the trip ending. Gari will act as a neutral mediator. Both parties are required to submit evidence (photos, messages, receipts). Gari's decision on deposit allocation is final and binding. Gari is not liable for losses exceeding the security deposit amount.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `Gari is a marketplace platform and is not liable for: (a) the condition of listed vehicles; (b) the conduct of Hosts or Renters; (c) loss, theft, or damage to personal belongings during a rental; or (d) any indirect, incidental, or consequential damages. Gari's total liability to any user shall not exceed the total fees paid by that user in the 12 months preceding the claim.`,
  },
  {
    title: '10. Intellectual Property',
    body: `All Platform content, branding, and technology is the property of Gari or its licensors. Users may not copy, modify, distribute, or use Gari's brand materials without prior written consent. Users grant Gari a non-exclusive, royalty-free license to use photos and content submitted to the Platform for the purpose of operating and promoting the service.`,
  },
  {
    title: '11. Governing Law',
    body: `These Terms are governed by the laws of the Republic of Rwanda. Any disputes arising from these Terms shall be resolved in the competent courts of Rwanda. For any questions about these Terms, contact us at legal@gari.rw or via WhatsApp at +250 788 123 000.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-text-primary dark:text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-text-secondary text-sm">
            Last updated: April 2026 &nbsp;·&nbsp; Governing law: Republic of Rwanda
          </p>
        </div>

        <div className="card p-6 md:p-8 space-y-8">
          {SECTIONS.map(s => (
            <div key={s.title}>
              <h2 className="text-base font-bold text-text-primary dark:text-white mb-2">{s.title}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-text-light mt-8">
          Questions? Email{' '}
          <a href="mailto:legal@gari.rw" className="text-primary hover:underline">legal@gari.rw</a>
          {' '}or{' '}
          <a href="https://wa.me/250788123000" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            WhatsApp us
          </a>.
        </p>
      </div>
    </div>
  );
}
