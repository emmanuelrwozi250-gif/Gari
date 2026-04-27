'use client';

import { useEffect, useState } from 'react';
import { formatRWF } from '@/lib/utils';
import { COMPANY } from '@/lib/config/company';

function formatUSD(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

const PIN = '2025GARI';
const STORAGE_KEY = 'gari_investor_unlocked';

export function InvestorsClient() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setUnlocked(true);
    }
    setChecked(true);
  }, []);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (pin === PIN) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setPin('');
    }
  }

  if (!checked) return null;

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-bg dark:bg-gray-950">
        <div className={`card p-8 w-full max-w-sm text-center ${shake ? 'animate-shake' : ''}`}>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-text-light mb-1">Gari</div>
          <h1 className="text-xl font-extrabold text-text-primary dark:text-white mb-1">Investor Access</h1>
          <p className="text-sm text-text-secondary mb-6">This page is confidential. Enter your access PIN to continue.</p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setError(false); }}
              placeholder="Enter PIN"
              className={`input text-center text-lg tracking-widest w-full ${error ? 'border-red-400 bg-red-50 dark:bg-red-950/20' : ''}`}
              autoFocus
            />
            {error && <p className="text-xs text-red-500">Incorrect PIN. Please try again.</p>}
            <button type="submit" className="btn-primary w-full">
              Enter
            </button>
          </form>
          <p className="text-xs text-text-light mt-4">
            Contact <a href={`mailto:${COMPANY.email}`} className="text-primary hover:underline">{COMPANY.email}</a> for access.
          </p>
        </div>
        <style>{`.animate-shake { animation: shake 0.5s ease-in-out; } @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="bg-primary text-white py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Confidential · April 2026</div>
            <h1 className="text-3xl font-extrabold">Gari — Investor Deck</h1>
            <p className="text-primary-light mt-1">Rwanda&apos;s Peer-to-Peer Car Rental Marketplace</p>
          </div>
          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); setUnlocked(false); }}
            className="text-xs opacity-60 hover:opacity-100 underline flex-shrink-0"
          >
            Lock
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">

        {/* 1. The Problem */}
        <section>
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-4 border-b border-border pb-2">
            🚗 The Problem
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { stat: '70%', label: 'of Kigali trips rely on motos or informal taxis', icon: '🛵' },
              { stat: '20%', label: 'car ownership rate — huge supply untapped', icon: '🔑' },
              { stat: '3×', label: 'more expensive than Rwanda average for formal rentals', icon: '💸' },
            ].map(({ stat, label, icon }) => (
              <div key={stat} className="card p-5 text-center">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="text-2xl font-extrabold text-primary mb-1">{stat}</div>
                <p className="text-xs text-text-secondary">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Our Solution */}
        <section>
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-4 border-b border-border pb-2">
            ✅ Our Solution
          </h2>
          <div className="card p-6">
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Gari is Rwanda&apos;s first peer-to-peer car rental marketplace — built specifically for Rwanda. Private car owners
              list their vehicles; verified renters book them directly. Every renter is NIDA-verified, every trip is insured,
              and every payout goes via MTN MoMo within 24 hours.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'For Renters', desc: 'Affordable, reliable cars with transparent pricing. No hidden fees.' },
                { label: 'For Hosts', desc: 'Earn RWF 550k–2.6M/month from a car that would otherwise sit idle.' },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4">
                  <p className="font-bold text-text-primary dark:text-white text-sm mb-1">{label}</p>
                  <p className="text-xs text-text-secondary">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Market Opportunity */}
        <section>
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-4 border-b border-border pb-2">
            📊 Market Opportunity
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Rwanda TAM', value: formatRWF(18_000_000_000), sub: 'total car rental market/year' },
              { label: 'Kigali Population', value: '1.5M', sub: 'fastest-growing city in Africa' },
              { label: 'Africa P2P Car Market', value: formatUSD(500_000_000), sub: 'projected by 2028 (no dominant player)' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="card p-5">
                <p className="text-xs text-text-light uppercase tracking-wide mb-1">{label}</p>
                <p className="text-2xl font-extrabold text-primary">{value}</p>
                <p className="text-xs text-text-secondary mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Traction */}
        <section>
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-4 border-b border-border pb-2">
            🚀 Traction (April 2026)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: '30+', label: 'Verified cars' },
              { value: '500+', label: 'Trips completed' },
              { value: '4.8★', label: 'Average rating' },
              { value: '15', label: 'Districts covered' },
            ].map(({ value, label }) => (
              <div key={label} className="card p-4 text-center">
                <div className="text-2xl font-extrabold text-primary">{value}</div>
                <p className="text-xs text-text-secondary mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="card p-5 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-text-primary dark:text-white">Zero fraud to date</span>
            </div>
            <p className="text-xs text-text-secondary">Every renter is NIDA-verified. Every host vehicle is inspected before listing. Our trust layer removes the biggest barrier to P2P vehicle sharing in Africa.</p>
          </div>
        </section>

        {/* 5. Business Model */}
        <section>
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-4 border-b border-border pb-2">
            💰 Business Model
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { stream: 'Platform Fee', value: '10%', desc: 'Taken from each booking automatically' },
              { stream: 'Insurance Add-on', value: formatRWF(5000) + '/trip', desc: 'Optional coverage purchased by renter' },
              { stream: 'Security Deposit', value: 'Held & released', desc: 'Gari holds deposit; released on safe return within 48h' },
            ].map(({ stream, value, desc }) => (
              <div key={stream} className="card p-5">
                <p className="text-xs text-text-light uppercase tracking-wide mb-1">{stream}</p>
                <p className="text-xl font-extrabold text-primary">{value}</p>
                <p className="text-xs text-text-secondary mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Unit Economics */}
        <section>
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-4 border-b border-border pb-2">
            📐 Unit Economics (per booking)
          </h2>
          <div className="card p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {[
                  { item: 'Average trip duration', value: '3 days' },
                  { item: 'Average daily rate', value: formatRWF(40_000) },
                  { item: 'Average booking value (GMV)', value: formatRWF(120_000) },
                  { item: 'Platform take (10%)', value: formatRWF(12_000), highlight: true },
                  { item: 'Host payout (90%)', value: formatRWF(108_000) },
                  { item: 'Monthly GMV target (125 bookings)', value: formatRWF(15_000_000) },
                  { item: 'Monthly platform revenue target', value: formatRWF(1_500_000), highlight: true },
                ].map(({ item, value, highlight }) => (
                  <tr key={item} className={highlight ? 'bg-primary/5 dark:bg-primary/10' : ''}>
                    <td className="py-2.5 pr-4 text-text-secondary">{item}</td>
                    <td className={`py-2.5 font-semibold text-right ${highlight ? 'text-primary' : 'text-text-primary dark:text-white'}`}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. Roadmap */}
        <section>
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-4 border-b border-border pb-2">
            🗺️ Roadmap
          </h2>
          <div className="space-y-3">
            {[
              { quarter: 'Q2 2026', milestone: '50+ verified cars · 15+ districts · MoMo direct integration' },
              { quarter: 'Q3 2026', milestone: 'EBM receipt system · Insurance partnership · Fleet dashboard' },
              { quarter: 'Q4 2026', milestone: '200+ cars · Full mobile app launch · 1,000+ trips/month' },
              { quarter: '2027', milestone: 'Expand to Kenya & Uganda · Series A raise · 5,000+ cars' },
            ].map(({ quarter, milestone }, i) => (
              <div key={quarter} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-text-secondary'}`}>
                    {i + 1}
                  </div>
                  {i < 3 && <div className="w-px h-6 bg-border mt-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">{quarter}</p>
                  <p className="text-sm text-text-secondary mt-0.5">{milestone}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. The Ask */}
        <section>
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-4 border-b border-border pb-2">
            🤝 The Ask
          </h2>
          <div className="card p-6">
            <div className="text-3xl font-extrabold text-primary mb-1">{formatUSD(250_000)}</div>
            <p className="text-sm text-text-secondary mb-5">Seed round · SAFE instrument · No equity dilution until Series A</p>
            <div className="space-y-3">
              {[
                { pct: '60%', use: 'Growth', desc: 'Supply acquisition (host incentives), marketing, district expansion' },
                { pct: '25%', use: 'Technology', desc: 'Mobile app (iOS + Android), MoMo integration, EBM receipts' },
                { pct: '15%', use: 'Operations', desc: 'Team, inspections, customer support, legal & compliance' },
              ].map(({ pct, use, desc }) => (
                <div key={use} className="flex gap-4">
                  <div className="text-xl font-extrabold text-primary w-12 flex-shrink-0">{pct}</div>
                  <div>
                    <p className="font-semibold text-text-primary dark:text-white text-sm">{use}</p>
                    <p className="text-xs text-text-secondary">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 border-t border-border">
          <h2 className="text-xl font-extrabold text-text-primary dark:text-white mb-3">Interested in Learning More?</h2>
          <p className="text-sm text-text-secondary mb-6">
            We&apos;re happy to share our full financial model, customer data, and cap table. Reach out directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent("Hi, I'm interested in investing in Gari. I'd love to discuss the opportunity.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 justify-center"
            >
              💬 WhatsApp Us
            </a>
            <a
              href={`mailto:${COMPANY.email}?subject=Gari Investment Inquiry`}
              className="border-2 border-primary text-primary font-semibold px-6 py-2.5 rounded-pill hover:bg-primary/5 transition-colors inline-flex items-center gap-2 justify-center"
            >
              ✉️ Email Us
            </a>
          </div>
          <p className="text-xs text-text-light mt-6">
            This document contains confidential and proprietary information of Gari. Do not distribute.
          </p>
        </section>

      </div>
    </div>
  );
}
