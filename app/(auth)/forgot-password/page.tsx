import type { Metadata } from 'next';
import Link from 'next/link';
import { Car, MessageCircle, Mail, ArrowLeft } from 'lucide-react';
import { COMPANY } from '@/lib/config/company';

export const metadata: Metadata = {
  title: 'Reset Password — Gari',
  robots: { index: false, follow: false },
};

const waLink = `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent('Hi Gari, I need help resetting my password for my account.')}`;

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Car className="w-8 h-8 text-primary" />
            <span className="text-3xl font-extrabold">
              Gar<span className="text-accent-yellow">i</span>
              <span className="text-primary text-sm">•</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">Reset your password</h1>
          <p className="text-text-secondary mt-1">
            We&apos;ll help you get back into your account
          </p>
        </div>

        <div className="card p-8">
          <p className="text-sm text-text-secondary mb-6 text-center">
            Contact our support team and we&apos;ll reset your password within minutes.
          </p>

          <div className="space-y-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl transition-colors text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              Reset via WhatsApp (fastest)
            </a>

            <a
              href={`mailto:${COMPANY.email}?subject=Password Reset Request&body=Hi Gari team, I need help resetting my password for my account.`}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 border-2 border-border hover:border-primary text-text-primary dark:text-gray-200 font-medium rounded-xl transition-colors text-sm"
            >
              <Mail className="w-5 h-5 text-primary" />
              Reset via Email
            </a>
          </div>

          <p className="text-center text-xs text-text-light mt-6">
            Typically resolved in under 5 minutes during business hours.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
