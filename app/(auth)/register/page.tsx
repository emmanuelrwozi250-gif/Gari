'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Upload, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { STATS } from '@/config/social-proof';

type Role = 'RENTER' | 'HOST' | 'BOTH';
type RenterType = 'LOCAL' | 'FOREIGN';

// 195 countries, abbreviated list (most common for Rwanda visitors + all continents)
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahrain','Bangladesh','Belgium','Benin','Bolivia','Bosnia and Herzegovina',
  'Botswana','Brazil','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada',
  'Central African Republic','Chad','Chile','China','Colombia','Congo (DRC)','Congo (Republic)',
  'Costa Rica','Croatia','Cuba','Czech Republic','Denmark','Djibouti','Ecuador','Egypt',
  'El Salvador','Eritrea','Ethiopia','Finland','France','Gabon','Gambia','Georgia','Germany',
  'Ghana','Greece','Guatemala','Guinea','Guinea-Bissau','Haiti','Honduras','Hungary','India',
  'Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan',
  'Kazakhstan','Kenya','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Liberia',
  'Libya','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Mali','Malta','Mauritania',
  'Mauritius','Mexico','Moldova','Mongolia','Morocco','Mozambique','Myanmar','Namibia','Nepal',
  'Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia',
  'Norway','Oman','Pakistan','Palestine','Panama','Paraguay','Peru','Philippines','Poland',
  'Portugal','Qatar','Romania','Russia','Senegal','Serbia','Sierra Leone','Singapore',
  'Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka',
  'Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo',
  'Tunisia','Turkey','Turkmenistan','Uganda','Ukraine','United Arab Emirates','United Kingdom',
  'United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
].sort();

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('RENTER');
  const [renterType, setRenterType] = useState<RenterType>('LOCAL');
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    nationality: '', passportNumber: '', passportExpiry: '',
  });

  async function uploadPassport(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('bucket', 'kyc-docs');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) return null;
    const { url } = await res.json();
    return url;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    if (renterType === 'FOREIGN') {
      if (!form.nationality) { toast.error('Please select your nationality'); return; }
      if (!form.passportNumber) { toast.error('Please enter your passport number'); return; }
      if (!form.passportExpiry) { toast.error('Please enter your passport expiry date'); return; }
      if (new Date(form.passportExpiry) <= new Date()) { toast.error('Passport must not be expired'); return; }
      if (!passportFile) { toast.error('Please upload a photo of your passport'); return; }
    }

    setLoading(true);
    try {
      let passportImageUrl: string | undefined;
      if (renterType === 'FOREIGN' && passportFile) {
        passportImageUrl = (await uploadPassport(passportFile)) ?? undefined;
        if (!passportImageUrl) throw new Error('Failed to upload passport photo');
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: renterType === 'LOCAL' ? form.phone : undefined,
          password: form.password,
          role,
          renterType,
          nationality: renterType === 'FOREIGN' ? form.nationality : undefined,
          passportNumber: renterType === 'FOREIGN' ? form.passportNumber : undefined,
          passportExpiry: renterType === 'FOREIGN' ? form.passportExpiry : undefined,
          passportImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      await signIn('credentials', { email: form.email, password: form.password, redirect: false });

      if (renterType === 'FOREIGN') {
        toast.success('Account created! Our team will verify your passport within 2 hours.');
        router.push('/dashboard?verified=pending');
      } else {
        toast.success('Account created! Welcome to Gari.');
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Car className="w-8 h-8 text-primary" />
            <span className="text-3xl font-extrabold">
              Gar<span className="text-accent-yellow">i</span>
              <span className="text-primary text-sm">•</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">Create your account</h1>
          <p className="text-text-secondary mt-1">Join {STATS.tripsCompleted} people already on Gari</p>
        </div>

        <div className="card p-8">
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-border rounded-xl text-sm font-medium hover:border-primary hover:bg-primary-light transition-all mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center mb-4">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs text-text-light bg-white dark:bg-gray-900">or register with email</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* WHERE ARE YOU FROM */}
            <div>
              <label className="label">I am a:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRenterType('LOCAL')}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    renterType === 'LOCAL'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl">🇷🇼</span>
                  <span className="font-semibold">Rwandan Resident</span>
                  <span className="text-xs text-text-light">Verify with NIDA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRenterType('FOREIGN')}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    renterType === 'FOREIGN'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-border text-text-secondary hover:border-blue-400/50'
                  }`}
                >
                  <span className="text-2xl">🌍</span>
                  <span className="font-semibold">International Visitor</span>
                  <span className="text-xs text-text-light">Verify with Passport</span>
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="label">I want to</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'RENTER', label: '🚗 Rent Cars', desc: 'Find & book' },
                  { value: 'HOST', label: '🏠 Host Cars', desc: 'Earn money' },
                  { value: 'BOTH', label: '↕️ Both', desc: 'Rent & host' },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value as Role)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                      role === value ? 'border-primary bg-primary-light text-primary' : 'border-border text-text-secondary hover:border-primary/50'
                    }`}
                  >
                    <span className="text-base">{label}</span>
                    <span className="text-text-light text-xs">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div>
              <label className="label">
                Full Name {renterType === 'FOREIGN' && <span className="text-text-light font-normal">(as in passport)</span>}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder={renterType === 'FOREIGN' ? 'As it appears in your passport' : 'Jean-Pierre Habimana'}
                  className="input pl-10" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">
                Email Address {renterType === 'FOREIGN' && <span className="text-red-500 font-normal text-xs">(required — booking confirmations sent here)</span>}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" className="input pl-10" required />
              </div>
            </div>

            {/* LOCAL: Rwanda phone */}
            {renterType === 'LOCAL' && (
              <div>
                <label className="label">Phone Number (Rwanda)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                  <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-text-secondary">+250</span>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="7XX XXX XXX" className="input pl-20" />
                </div>
              </div>
            )}

            {/* FOREIGN: nationality + passport fields */}
            {renterType === 'FOREIGN' && (
              <div className="space-y-4 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">International Visitor Verification</p>
                </div>

                {/* Nationality */}
                <div>
                  <label className="label text-xs">Nationality</label>
                  <select
                    value={form.nationality}
                    onChange={e => setForm({ ...form, nationality: e.target.value })}
                    className="input text-sm"
                    required={renterType === 'FOREIGN'}
                  >
                    <option value="">Select your country…</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Phone (international, optional) */}
                <div>
                  <label className="label text-xs">Phone Number <span className="text-text-light font-normal">(optional — WhatsApp if available)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 555 000 0000" className="input pl-9 text-sm" />
                  </div>
                </div>

                {/* Passport number */}
                <div>
                  <label className="label text-xs">Passport Number</label>
                  <input
                    type="text"
                    value={form.passportNumber}
                    onChange={e => setForm({ ...form, passportNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. AB1234567"
                    className="input text-sm font-mono tracking-wider"
                    required={renterType === 'FOREIGN'}
                  />
                </div>

                {/* Passport expiry */}
                <div>
                  <label className="label text-xs">Passport Expiry Date</label>
                  <input
                    type="date"
                    value={form.passportExpiry}
                    onChange={e => setForm({ ...form, passportExpiry: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="input text-sm"
                    required={renterType === 'FOREIGN'}
                  />
                </div>

                {/* Passport photo upload */}
                <div>
                  <label className="label text-xs">Passport Photo Page</label>
                  <p className="text-xs text-text-light mb-2">Upload a clear photo of the page with your photo and personal details. JPEG, PNG or PDF · Max 5MB.</p>
                  <label className={`flex items-center gap-3 cursor-pointer border-2 border-dashed rounded-xl p-3 transition-colors ${
                    passportFile
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-border hover:border-blue-400/60'
                  }`}>
                    <Upload className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {passportFile ? (
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate">{passportFile.name}</p>
                      ) : (
                        <p className="text-xs text-text-secondary">Click to upload passport photo page</p>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f && f.size > 5 * 1024 * 1024) { toast.error('File too large — max 5MB'); return; }
                        setPassportFile(f ?? null);
                      }}
                    />
                  </label>
                </div>

                <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3">
                  ℹ️ Our team verifies passports within <strong>2 hours</strong>. You&apos;ll receive an email confirmation before making your first booking.
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters" className="input pl-10 pr-10" required minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-secondary">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-text-secondary">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-primary">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary">Privacy Policy</Link>.
            </p>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {renterType === 'FOREIGN' ? 'Uploading & creating account…' : 'Creating account…'}</>
              ) : (
                renterType === 'FOREIGN' ? 'Submit for Verification' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:text-primary-dark">Sign in</Link>
          </p>
        </div>

        {renterType === 'FOREIGN' && (
          <div className="mt-4 text-center">
            <Link href="/international" className="text-sm text-primary hover:underline">
              Learn more about renting as an international visitor →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
