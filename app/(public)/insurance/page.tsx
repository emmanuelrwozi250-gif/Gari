import type { Metadata } from 'next';
import { Shield, CheckCircle, XCircle, FileText, Phone, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Insurance — Gari',
  description: 'Every Gari rental includes Basic Insurance. Learn what\'s covered, claim limits in RWF, and how to file a claim.',
};

export default function InsurancePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary dark:text-white mb-3">
            Every Trip is Covered
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Gari Basic Insurance is automatically included on every booking — no add-ons, no surprises.
          </p>
        </div>

        <div className="space-y-6">
          {/* What's Covered */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-text-primary dark:text-white">What&apos;s Covered</h2>
            </div>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-text-primary dark:text-white">Vehicle damage</strong> — Collision, accidental damage, and theft of the rental car</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-text-primary dark:text-white">Third-party liability</strong> — Damage caused to other vehicles or property up to RWF 5,000,000</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-text-primary dark:text-white">Medical expenses</strong> — Emergency medical costs for renter up to RWF 500,000</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-text-primary dark:text-white">Roadside assistance</strong> — Emergency towing within Kigali city limits</span>
              </li>
            </ul>
          </div>

          {/* Coverage Limits */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">Coverage Limits</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-text-secondary font-medium">Coverage Type</th>
                    <th className="text-right py-2 text-text-secondary font-medium">Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr>
                    <td className="py-3 text-text-primary dark:text-white">Vehicle damage / theft</td>
                    <td className="py-3 text-right font-semibold text-primary">Up to vehicle value</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-text-primary dark:text-white">Third-party liability</td>
                    <td className="py-3 text-right font-semibold text-primary">RWF 5,000,000</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-text-primary dark:text-white">Medical expenses</td>
                    <td className="py-3 text-right font-semibold text-primary">RWF 500,000</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-text-primary dark:text-white">Roadside towing (Kigali)</td>
                    <td className="py-3 text-right font-semibold text-primary">Included</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* What's NOT Covered */}
          <div className="card p-6 border-l-4 border-l-amber-400">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-text-primary dark:text-white">What&apos;s Not Covered</h2>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> Intentional damage or gross negligence</li>
              <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> Driving under the influence of alcohol or drugs</li>
              <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> Off-road use (unless the car is listed as an SUV/4x4 safari vehicle)</li>
              <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> Personal belongings left in the car</li>
              <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> Damage reported after 48 hours without notification to Gari</li>
              <li className="flex items-start gap-2"><XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> Use of the vehicle outside Rwanda without prior written approval</li>
            </ul>
          </div>

          {/* How to Claim */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="w-6 h-6 text-primary flex-shrink-0" />
              <h2 className="text-lg font-bold text-text-primary dark:text-white">How to File a Claim</h2>
            </div>
            <ol className="space-y-3 text-sm text-text-secondary list-decimal list-inside">
              <li>Contact Gari support within <strong className="text-text-primary dark:text-white">48 hours</strong> of the incident via WhatsApp (+250 788 123 000)</li>
              <li>Take photos of any damage — all angles</li>
              <li>Do not move the vehicle if it is unsafe to do so</li>
              <li>Complete the incident report form sent by our team via WhatsApp</li>
              <li>Our claims team will respond within 2 business days</li>
            </ol>
            <div className="mt-4 p-3 bg-primary/5 rounded-xl text-sm text-primary font-medium">
              Claims hotline: +250 788 123 000 (24/7 for active bookings)
            </div>
          </div>

          {/* Insurance Certificate */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary flex-shrink-0" />
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Your Insurance Certificate</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              An insurance certificate is automatically generated after your payment is confirmed. You can find it in your booking dashboard under any confirmed or active booking. The certificate includes your policy number, coverage period, and the insurer&apos;s claims contact. Print or screenshot it to keep in the car during your trip.
            </p>
          </div>

          {/* International Renters */}
          <div className="card p-6 border-l-4 border-blue-400">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-text-primary dark:text-white">Coverage for International Renters</h2>
            </div>
            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>
                All Gari insurance coverage applies equally to foreign national renters. Your nationality does not affect the scope of coverage — the policy is tied to the vehicle and the booking, not the renter&apos;s citizenship.
              </p>
              <p>
                <strong className="text-text-primary dark:text-white">Important:</strong> To be covered while driving, international renters must carry both their home country driving licence and a valid International Driving Permit (IDP). Driving without an IDP may void coverage and violate Rwandan traffic law.
              </p>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 space-y-2">
                <p className="font-semibold text-blue-800 dark:text-blue-200">Coverage limits (same for all renters)</p>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Third-party liability: up to RWF 20,000,000</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Vehicle damage (Gari Protect): up to RWF 2,000,000</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Medical expenses: up to RWF 3,000,000 per person</li>
                </ul>
              </div>
              <p>
                Claims must be reported within 48 hours of the incident via WhatsApp or the Gari dashboard. Provide a passport copy, IDP copy, and incident photos when filing.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
