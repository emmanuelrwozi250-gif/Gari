'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { STATS } from '@/config/social-proof';

type Role = 'RENTER' | 'HOST' | 'BOTH';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('RENTER');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Auto sign in
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      toast.success('Account created! Welcome to Gari.');
      router.push('/dashboard');
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
          <p className="text-text-secondary mt-1">Join {STATS.tripsCompleted} Rwandans already on Gari</p>
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

            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean-Pierre Habimana" className="input pl-10" required />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" className="input pl-10" required />
              </div>
            </div>

            <div>
              <label className="label">Phone Number (Rwanda)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-text-secondary">+250</span>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="7XX XXX XXX" className="input pl-20" />
              </div>
            </div>

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
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:text-primary-dark">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
