'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface NewsletterSignupProps {
  district?: string;
  placeholder?: string;
}

export function NewsletterSignup({ district, placeholder = 'Your email address' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, district }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium py-2">
        <CheckCircle className="w-4 h-4" />
        <span>You&apos;re on the list — we&apos;ll be in touch.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value); setErrorMsg(''); setStatus('idle'); }}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary transition-colors"
        required
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary text-sm px-4 py-2 whitespace-nowrap disabled:opacity-60"
      >
        {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {errorMsg && (
        <p className="absolute mt-10 text-xs text-red-400">{errorMsg}</p>
      )}
    </form>
  );
}
