'use client';

import { useEffect, useState } from 'react';
import { Copy, CheckCircle, TrendingUp, Users, Share2, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatRWF } from '@/lib/utils';

interface ReferralData {
  code: string;
  totalReferrals: number;
  totalEarningsRwf: number;
  pendingRwf: number;
  shareUrl: string;
}

const HOW_IT_WORKS = [
  { step: '1', title: 'Share your link', desc: 'Send your unique Gari referral link to friends, family, or your network via WhatsApp, Facebook, or SMS.' },
  { step: '2', title: 'They book a car', desc: 'When someone uses your link to make their first booking on Gari, it\'s automatically tracked.' },
  { step: '3', title: 'You earn 5%', desc: 'You receive 5% of the Gari platform fee for every booking they complete. No cap.' },
];

export default function ReferPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const copy = () => {
    if (!data?.shareUrl) return;
    navigator.clipboard.writeText(data.shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    if (!data) return;
    const msg = encodeURIComponent(
      `🚗 Rent a car anywhere in Rwanda with Gari!\n\nVerified cars, MTN MoMo payments, and great prices.\n\nUse my link to book: ${data.shareUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.code) {
    return (
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex flex-col items-center justify-center gap-4 px-4">
        <Gift className="w-12 h-12 text-text-light" />
        <h2 className="text-lg font-semibold text-text-primary dark:text-white">Sign in to get your referral link</h2>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  const waText = encodeURIComponent(
    `🚗 Rent a car anywhere in Rwanda with Gari!\n\nVerified cars, MTN MoMo payments, great prices.\n\nBook with my link: ${data.shareUrl}`
  );

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Gift className="w-4 h-4" /> Gari Agent Programme
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Earn by Referring</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Share your link. When someone books through it, you earn <strong>5% of Gari's fee</strong> — automatically, every time.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Referrals', value: data.totalReferrals.toString() },
            { icon: TrendingUp, label: 'Earned', value: data.totalEarningsRwf > 0 ? formatRWF(data.totalEarningsRwf) : 'RWF 0' },
            { icon: Gift, label: 'Pending', value: data.pendingRwf > 0 ? formatRWF(data.pendingRwf) : 'RWF 0' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-4 text-center">
              <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="font-bold text-text-primary dark:text-white text-sm sm:text-base">{value}</div>
              <div className="text-xs text-text-light mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Referral link card */}
        <div className="card p-6">
          <h2 className="font-bold text-text-primary dark:text-white mb-1">Your referral link</h2>
          <p className="text-sm text-text-secondary mb-4">Share this link anywhere. Bookings traced to it earn you 5% of the platform fee.</p>

          {/* Code display */}
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-4">
            <span className="flex-1 font-mono text-sm text-primary font-semibold truncate">{data.shareUrl}</span>
            <button onClick={copy} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark transition-colors flex-shrink-0">
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Code badge */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-sm text-text-secondary">Your code:</span>
            <span className="font-bold text-lg tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-lg">{data.code}</span>
          </div>

          {/* Share buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={shareWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share on WhatsApp
            </button>
            <button
              onClick={copy}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary hover:text-white transition-colors text-sm"
            >
              <Share2 className="w-4 h-4" />
              Copy link
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="card p-6">
          <h2 className="font-bold text-text-primary dark:text-white mb-5">How it works</h2>
          <div className="space-y-5">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary dark:text-white text-sm">{title}</h3>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings example */}
        <div className="card p-6 bg-primary/5 border border-primary/20">
          <h2 className="font-bold text-text-primary dark:text-white mb-3">Example earnings</h2>
          <div className="space-y-2 text-sm">
            {[
              { trips: 5,  rate: 35000, label: '5 economy rentals (3 days each)' },
              { trips: 3,  rate: 80000, label: '3 SUV rentals (5 days each)' },
              { trips: 10, rate: 28000, label: '10 short city rentals (2 days)' },
            ].map(({ trips, rate, label }) => {
              const subtotal = trips * rate * (label.includes('3 days') ? 3 : label.includes('5 days') ? 5 : 2);
              const fee = Math.round(subtotal * 0.10);
              const commission = Math.round(fee * 0.05);
              return (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary text-xs">{label}</span>
                  <span className="font-bold text-primary whitespace-nowrap">{formatRWF(commission)}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-text-light mt-4">Based on 5% of the 12% Gari platform fee. Paid out monthly via MoMo.</p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/search" className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:gap-3 transition-all">
            Browse cars to share with your network <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
