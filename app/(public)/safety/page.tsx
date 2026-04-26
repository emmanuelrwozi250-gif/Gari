import type { Metadata } from 'next';
import { Shield, BadgeCheck, Phone, AlertTriangle, Car, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Safety — Gari',
  description: 'How Gari keeps renters and hosts safe. Identity verification, car vetting, insurance, and 24/7 support.',
};

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary dark:text-white mb-3">
            Your Safety is Our Priority
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Gari is built on trust. Every renter, every host, and every car goes through a verification process before any booking takes place.
          </p>
        </div>

        <div className="space-y-6">
          {/* Identity Verification */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <BadgeCheck className="w-6 h-6 text-primary flex-shrink-0" />
              <h2 className="text-lg font-bold text-text-primary dark:text-white">NIDA Verification</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Every renter and host on Gari must verify their identity using Rwanda&apos;s NIDA system before their first booking. This means:
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> National ID or passport photo submitted</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> NIDA number cross-referenced with national registry</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Driving permit verified for renters</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Selfie with ID for additional confirmation</li>
            </ul>
          </div>

          {/* Car Vetting */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Car className="w-6 h-6 text-primary flex-shrink-0" />
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Car Vetting</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Vehicles listed on Gari are reviewed before going live. Our verification process includes:
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Photo review — minimum 4 high-quality images required</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Registration documents checked against the car details</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Insurance validity confirmed</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Physical inspection available for Premium listings</li>
            </ul>
          </div>

          {/* During Your Trip */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="w-6 h-6 text-primary flex-shrink-0" />
              <h2 className="text-lg font-bold text-text-primary dark:text-white">During Your Trip</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              Once your booking is confirmed, you&apos;re protected every step of the way:
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Host contact shared 1 hour before pickup</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Gari Basic Insurance active from pickup to return</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> 24/7 WhatsApp support at +250 788 123 000</li>
              <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Optional GPS tracking for longer rentals</li>
            </ul>
          </div>

          {/* Emergency Contacts */}
          <div className="card p-6 border-l-4 border-l-red-500">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Emergency Contacts</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                <div className="font-bold text-red-600 text-lg">113</div>
                <div className="text-text-secondary mt-1">Police</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
                <div className="font-bold text-orange-600 text-lg">912</div>
                <div className="text-text-secondary mt-1">Medical Emergency</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                <div className="font-bold text-red-600 text-lg">112</div>
                <div className="text-text-secondary mt-1">General Emergency</div>
              </div>
              <div className="bg-primary/5 rounded-xl p-4 text-center">
                <div className="font-bold text-primary text-lg">+250 788 123 000</div>
                <div className="text-text-secondary mt-1">Gari Support (24/7)</div>
              </div>
            </div>
          </div>

          {/* Reporting Issues */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-primary flex-shrink-0" />
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Reporting Issues</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              If something goes wrong during a rental, you can report it in three ways:
            </p>
            <ol className="mt-3 space-y-2 text-sm text-text-secondary list-decimal list-inside">
              <li>Through your booking dashboard — use the &quot;Report Issue&quot; button on any active or recent booking</li>
              <li>Via WhatsApp at +250 788 123 000 — send photos and a description</li>
              <li>By email to support@gari.rw — include your booking ID</li>
            </ol>
            <p className="mt-3 text-sm text-text-secondary">
              Our team responds within 2 hours during business hours and within 4 hours after hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
