'use client';

import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

const SUBJECTS = [
  'General Enquiry',
  'Booking Help',
  'Payment Issue',
  'Become a Host',
  'Report an Issue',
  'Corporate / NGO Rental',
  'Other',
];

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): Errors {
  const e: Errors = {};
  if (!form.name.trim()) e.name = 'Name is required';
  if (!form.email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
  if (!form.subject) e.subject = 'Please choose a subject';
  if (!form.message.trim()) e.message = 'Message is required';
  else if (form.message.trim().length < 20) e.message = 'Message must be at least 20 characters';
  return e;
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSubmitted(true);
    } catch {
      setErrors({ message: 'Something went wrong. Please try WhatsApp instead.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card p-8 text-center">
        <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">Message sent!</h3>
        <p className="text-text-secondary text-sm">
          Thank you, <strong>{form.name.split(' ')[0]}</strong>. We&apos;ll reply to <strong>{form.email}</strong> within 24 hours.
        </p>
        <p className="text-xs text-text-light mt-3">
          Need a faster response?{' '}
          <a href="https://wa.me/250788123000" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            WhatsApp us →
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="font-bold text-text-primary dark:text-white text-lg mb-5">Send us a message</h2>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Your Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Ange Uwimana"
              className={`input ${errors.name ? 'border-red-400 focus:ring-red-300' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="you@example.com"
              className={`input ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label className="label">Subject</label>
          <select
            value={form.subject}
            onChange={e => set('subject', e.target.value)}
            className={`input ${errors.subject ? 'border-red-400 focus:ring-red-300' : ''}`}
          >
            <option value="">Choose a subject…</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
        </div>

        <div>
          <label className="label">Message</label>
          <textarea
            value={form.message}
            onChange={e => set('message', e.target.value)}
            placeholder="Tell us how we can help…"
            rows={5}
            className={`input resize-none ${errors.message ? 'border-red-400 focus:ring-red-300' : ''}`}
          />
          {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
          <p className="text-xs text-text-light mt-1 text-right">{form.message.length} / 1000</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60"
        >
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Sending…</>
          ) : (
            <><Send className="w-4 h-4 mr-2" />Send Message</>
          )}
        </button>
      </form>
    </div>
  );
}
