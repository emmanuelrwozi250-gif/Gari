import type { Metadata } from 'next';
import { MessageCircle, Mail, MapPin, Clock, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us — Gari',
  description: 'Reach Gari support via WhatsApp, email, or visit our Kigali office. We\'re here Mon–Sat 8am–6pm.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-text-primary dark:text-white mb-3">
            We&apos;re Here to Help
          </h1>
          <p className="text-text-secondary">
            Got a question, problem, or just want to say hello? Reach us anytime.
          </p>
        </div>

        {/* WhatsApp — primary channel */}
        <div className="card p-8 text-center mb-6 border-2 border-primary/20">
          <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">WhatsApp Support</h2>
          <p className="text-text-secondary text-sm mb-1">Fastest response — typically under 30 minutes</p>
          <p className="font-bold text-2xl text-primary mb-5">+250 788 123 000</p>
          <a
            href="https://wa.me/250788123000?text=Hi%20Gari%2C%20I%20need%20help%20with%20my%20booking."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base"
          >
            <MessageCircle className="w-5 h-5" />
            Open WhatsApp Chat
          </a>
        </div>

        {/* Other channels */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-text-primary dark:text-white text-sm">Email</div>
                <div className="text-xs text-text-secondary">Response within 4 hours</div>
              </div>
            </div>
            <a href="mailto:support@gari.rw" className="text-primary text-sm font-medium hover:underline">
              support@gari.rw
            </a>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Phone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-semibold text-text-primary dark:text-white text-sm">Emergency (Active Trips)</div>
                <div className="text-xs text-text-secondary">24/7 for active bookings only</div>
              </div>
            </div>
            <a href="tel:+250788123000" className="text-primary text-sm font-medium hover:underline">
              +250 788 123 000
            </a>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-text-primary dark:text-white text-sm">Office Address</div>
                <div className="text-xs text-text-secondary">Walk-ins welcome</div>
              </div>
            </div>
            <p className="text-sm text-text-secondary">KG 7 Ave, Kigali, Rwanda</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-text-primary dark:text-white text-sm">Office Hours</div>
                <div className="text-xs text-text-secondary">Kigali time (CAT, UTC+2)</div>
              </div>
            </div>
            <p className="text-sm text-text-secondary">Mon – Sat: 8:00am – 6:00pm</p>
            <p className="text-sm text-text-secondary">Sunday: Closed</p>
          </div>
        </div>

        <div className="card p-5 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
          <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
            <strong>For police or medical emergencies</strong> — call <strong>112</strong> first, then contact Gari support.
          </p>
        </div>
      </div>
    </div>
  );
}
