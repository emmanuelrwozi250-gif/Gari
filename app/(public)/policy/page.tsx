import { Metadata } from 'next';
import Link from 'next/link';
import { RENTAL_POLICY } from '@/config/rental-policy';
import { formatRWF } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Booking Policy — Gari',
  description: 'Late return fees, extensions, cancellations, and damage policy for Gari car rentals in Rwanda.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="text-lg font-extrabold text-text-primary dark:text-white mb-4 pb-3 border-b border-border">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-3 border-b border-border last:border-0 ${highlight ? 'bg-red-50 dark:bg-red-900/10 -mx-4 px-4 rounded-lg' : ''}`}>
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-sm font-semibold text-right ${highlight ? 'text-red-600' : 'text-text-primary dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-text-primary dark:text-white mb-2">
            Booking Policy
          </h1>
          <p className="text-text-secondary">
            Everything you need to know before, during, and after your rental.
          </p>
        </div>

        {/* Late Return */}
        <Section title="⏱ Late Return Policy">
          <Row
            label="Grace period"
            value={`${RENTAL_POLICY.GRACE_PERIOD_MINUTES} minutes — no charge`}
          />
          <Row
            label="Late fee"
            value={`${formatRWF(RENTAL_POLICY.LATE_FEE_PER_HOUR_RWF)}/hour`}
            highlight
          />
          <Row
            label={`After ${RENTAL_POLICY.LATE_FULL_DAY_THRESHOLD_HOURS} hours late`}
            value="Full daily rate charged"
            highlight
          />
          <Row
            label="After 24 hours no contact"
            value="Gari support intervenes using your NIDA-verified identity"
            highlight
          />
          <p className="text-xs text-text-secondary mt-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            Late fees are calculated automatically from the moment your booking ends and the grace period expires.
            You can stop accruing fees at any time by extending your booking through the app.
          </p>
        </Section>

        {/* Extension */}
        <Section title="📅 Booking Extension">
          <Row label="Extend at any time" value="Via app or SMS" />
          <Row
            label="Extension rate"
            value="Same hourly rate as your daily rate (pro-rated)"
          />
          <Row
            label="Maximum extension"
            value={`${RENTAL_POLICY.EXTENSION_MAX_HOURS} hours per request`}
          />
          <Row label="Minimum extension" value={`${RENTAL_POLICY.EXTENSION_MIN_HOURS} hour`} />
          <Row label="Host notification" value="Instant — host notified automatically" />
          <p className="text-xs text-text-secondary mt-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-3">
            ⚠️ If the car is already booked by another renter for those hours, you will not be able to
            extend. Always check early — before your booking ends.
          </p>
        </Section>

        {/* Cancellation */}
        <Section title="❌ Cancellation Policy">
          <Row
            label={`More than ${RENTAL_POLICY.CANCEL_FREE_WINDOW_HOURS}h before pickup`}
            value="Full refund"
          />
          <Row
            label={`Less than ${RENTAL_POLICY.CANCEL_FREE_WINDOW_HOURS}h before pickup`}
            value={`${RENTAL_POLICY.CANCEL_PARTIAL_REFUND_PCT}% refund`}
          />
          <Row
            label="Host cancels"
            value={`${RENTAL_POLICY.HOST_CANCEL_RENTER_REFUND_PCT}% refund to you + host penalised`}
          />
          <Row
            label="Host doesn't respond"
            value={`${RENTAL_POLICY.HOST_CANCEL_RESPONSE_HOURS}h → auto-rejected, full refund`}
          />
          <p className="text-xs text-text-secondary mt-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            Refunds are processed within 3–5 business days via the same payment method used at booking.
          </p>
        </Section>

        {/* Deposit */}
        <Section title="🔒 Security Deposit">
          <Row label="Held by" value="Gari (in escrow)" />
          <Row label="Released when" value="Car returned safely, confirmed by host" />
          <Row label="Release timeline" value="Within 48 hours of safe return" />
          <Row label="If damage reported" value="Gari reviews photos, decides within 48h" />
          <Row label="Partial damage" value="Partial refund based on repair estimate" />
          <p className="text-xs text-text-secondary mt-4 bg-primary-light rounded-xl p-3">
            A pre-trip and post-trip inspection is recommended. Take photos before and after — these
            protect you in any dispute.
          </p>
        </Section>

        {/* Damage */}
        <Section title="🔧 Damage Policy">
          <Row label="Inspection" value="Required at pickup and return" />
          <Row label="Dispute window" value="Host must report damage within 24h of return" />
          <Row label="Evidence" value="Photos with timestamps required" />
          <Row label="Gari decision" value="Final — within 48 hours of dispute" />
          <Row label="Appeal" value="Contact support@gari.rw within 7 days" />
        </Section>

        {/* Repeat Offenders */}
        <Section title="⚠️ Repeat Late Returns">
          <Row
            label={`${RENTAL_POLICY.LATE_FLAG_COUNT} late returns`}
            value={`"Late returner" badge visible to hosts`}
          />
          <Row
            label={`${RENTAL_POLICY.SUSPENSION_COUNT} late returns in 6 months`}
            value={`Account suspended for ${RENTAL_POLICY.SUSPENSION_DAYS} days`}
            highlight
          />
          <p className="text-xs text-text-secondary mt-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            This policy protects our host community. Hosts volunteer their vehicles — repeated late
            returns disrupt their schedules and livelihoods.
          </p>
        </Section>

        <div className="text-center py-4">
          <p className="text-sm text-text-secondary mb-3">Questions about this policy?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/250788123000"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm py-2 px-5 inline-flex"
            >
              WhatsApp Support
            </a>
            <Link href="/faq" className="btn-secondary text-sm py-2 px-5 inline-flex">
              View FAQ
            </Link>
          </div>
          <p className="text-xs text-text-light mt-4">
            Last updated April 2025 · Governed by Rwandan law
          </p>
        </div>
      </div>
    </div>
  );
}
