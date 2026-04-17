import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Gari',
  description: 'Gari Privacy Policy — how we collect, use, and protect your data including NIDA verification and payment information.',
};

const SECTIONS = [
  {
    title: '1. Data We Collect',
    body: `When you use Gari, we collect: (a) Account data — name, email, phone number, and password hash; (b) Identity data — National ID or passport number, NIDA number, and photos for verification; (c) Driving permit details for renters; (d) Location data — approximate district and pickup location during bookings; (e) Payment data — processed via third-party providers (we never see full card numbers); (f) Booking history, reviews, and messages exchanged through the Platform; (g) Device data — IP address, browser type, and usage analytics.`,
  },
  {
    title: '2. How We Use Your Data',
    body: `Your data is used to: (a) Verify your identity before your first booking; (b) Process and manage your bookings and payments; (c) Send booking confirmations and reminders via WhatsApp and email; (d) Resolve disputes and enforce our Terms of Service; (e) Improve Platform features and safety; (f) Comply with Rwandan legal and regulatory requirements; and (g) Communicate important platform updates.`,
  },
  {
    title: '3. NIDA Verification Data',
    body: `NIDA (National Identification Agency) data is used solely to verify your identity. Your national ID number is cross-referenced with Rwanda's national registry during the verification process. Gari does not permanently store your NIDA number after verification is confirmed. Photos submitted for verification (front of ID, selfie with ID) are stored securely and are never shared with third parties or used for any purpose other than identity verification.`,
  },
  {
    title: '4. Payment Data',
    body: `All payment transactions are processed by third-party providers: Stripe (for card payments), MTN MoMo (for Mobile Money), and Airtel Money. Gari never stores or has access to full card numbers, CVV codes, or mobile money PINs. We store only transaction IDs, amounts, and statuses for booking records. Payment providers operate under their own privacy and security policies.`,
  },
  {
    title: '5. Third-Party Sharing',
    body: `Gari does not sell your personal data. We may share your data with: (a) Insurance providers — only the minimum data required to issue your trip insurance certificate; (b) Payment processors — as described above; (c) Legal authorities — when required by Rwandan law or court order; and (d) Service providers (e.g., cloud hosting, email delivery) who process data on our behalf under strict data processing agreements.`,
  },
  {
    title: '6. Your Rights',
    body: `You have the right to: (a) Access the personal data we hold about you; (b) Correct inaccurate data; (c) Request deletion of your account and data (subject to legal retention requirements); (d) Object to certain uses of your data; and (e) Export a copy of your data. To exercise any of these rights, email support@gari.rw with the subject line "Data Request — [your name]". We will respond within 14 business days.`,
  },
  {
    title: '7. Data Retention',
    body: `We retain your data as long as your account is active. If you delete your account: (a) Personal profile data is deleted within 90 days; (b) Booking history is retained for 7 years as required by Rwandan financial regulations; (c) Anonymized analytics data may be retained indefinitely. Data involved in ongoing disputes or legal proceedings is retained until the matter is resolved.`,
  },
  {
    title: '8. Security',
    body: `Gari uses industry-standard security measures including TLS encryption for all data in transit, encrypted database storage, access controls, and regular security reviews. Despite these measures, no system is 100% secure. If you suspect unauthorized access to your account, contact us immediately at support@gari.rw.`,
  },
  {
    title: '9. Contact & Data Protection',
    body: `For any privacy-related questions, requests, or concerns, contact our Data Protection Officer at support@gari.rw. You can also reach us by WhatsApp at +250 788 123 000 or in writing at: Gari, KG 7 Ave, Kigali, Rwanda. This Privacy Policy is governed by the laws of the Republic of Rwanda.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-text-primary dark:text-white mb-3">
            Privacy Policy
          </h1>
          <p className="text-text-secondary text-sm">
            Last updated: January 2025 &nbsp;·&nbsp; Governing law: Republic of Rwanda
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
          <a href="mailto:support@gari.rw" className="text-primary hover:underline">support@gari.rw</a>
          {' '}or{' '}
          <a href="https://wa.me/250788123000" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            WhatsApp us
          </a>.
        </p>
      </div>
    </div>
  );
}
