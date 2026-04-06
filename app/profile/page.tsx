'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  User, Phone, Globe, Shield, Car, BadgeCheck, Star,
  TrendingUp, LogOut, Edit3, Save, X, ChevronRight,
  ShieldCheck, Tag, Building2, Bell, Loader2,
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  nidaNumber: string | null;
  nidaVerified: boolean;
  licenseVerified: boolean;
  whatsappNumber: string | null;
  preferredLanguage: string;
  saccoName: string | null;
  saccoMemberId: string | null;
  saccoVerified: boolean;
  trustScore: number;
  communityVerified: boolean;
  trustCircleId: string | null;
  isSeller: boolean;
  isInvestor: boolean;
  superhostSince: string | null;
  totalHostTrips: number;
  responseRate: number;
  stripeOnboarded: boolean;
  createdAt: string;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'fr', label: 'Français' },
];

function trustColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-500';
}

function trustLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Building';
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', whatsappNumber: '', preferredLanguage: 'en' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/profile');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(r => r.json())
        .then(data => {
          setProfile(data);
          setForm({
            name: data.name || '',
            phone: data.phone || '',
            whatsappNumber: data.whatsappNumber || '',
            preferredLanguage: data.preferredLanguage || 'en',
          });
        })
        .catch(() => toast.error('Failed to load profile'))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(prev => prev ? { ...prev, ...data } : prev);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const isHost = ['HOST', 'BOTH', 'ADMIN'].includes(profile.role);

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8 pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-extrabold text-primary ring-4 ring-primary/20">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-text-primary dark:text-white truncate">{profile.name}</h1>
            <p className="text-text-secondary text-sm truncate">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-bold ${trustColor(profile.trustScore)}`}>
                {profile.trustScore} pts
              </span>
              <span className={`text-xs ${trustColor(profile.trustScore)}`}>· {trustLabel(profile.trustScore)} trust</span>
              {profile.communityVerified && (
                <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Community Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Trust Score breakdown */}
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-text-primary dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Trust Score
            </h2>
            <span className={`text-xl font-extrabold ${trustColor(profile.trustScore)}`}>{profile.trustScore}/100</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                profile.trustScore >= 80 ? 'bg-green-500' :
                profile.trustScore >= 60 ? 'bg-primary' :
                profile.trustScore >= 40 ? 'bg-yellow-500' : 'bg-red-400'
              }`}
              style={{ width: `${profile.trustScore}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Email verified', done: !!profile.email, pts: 10 },
              { label: 'Phone added', done: !!profile.phone, pts: 10 },
              { label: 'NIDA verified', done: profile.nidaVerified, pts: 20 },
              { label: 'Licence verified', done: profile.licenseVerified, pts: 15 },
              { label: 'SACCO verified', done: profile.saccoVerified, pts: 20 },
              { label: '5+ trips', done: profile.totalHostTrips >= 5, pts: 10 },
            ].map(({ label, done, pts }) => (
              <div key={label} className={`flex items-center gap-1.5 p-2 rounded-lg ${done ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <BadgeCheck className={`w-3.5 h-3.5 flex-shrink-0 ${done ? 'text-green-600' : 'text-gray-300'}`} />
                <span className={done ? 'text-green-700 dark:text-green-400' : 'text-text-secondary'}>{label}</span>
                <span className={`ml-auto font-semibold ${done ? 'text-green-600' : 'text-text-light'}`}>+{pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verification status */}
        <div className="card p-5 mb-4">
          <h2 className="font-bold text-text-primary dark:text-white mb-3 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-primary" /> Verification
          </h2>
          <div className="space-y-2">
            {[
              { label: 'National ID (NIDA)', done: profile.nidaVerified, icon: Shield },
              { label: 'Driving Licence', done: profile.licenseVerified, icon: Car },
              { label: 'SACCO / Community', done: profile.saccoVerified, icon: ShieldCheck },
            ].map(({ label, done, icon: Icon }) => (
              <div key={label} className={`flex items-center justify-between p-3 rounded-xl ${done ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center gap-2 text-sm">
                  <Icon className={`w-4 h-4 ${done ? 'text-green-600' : 'text-text-light'}`} />
                  <span className={done ? 'text-green-700 dark:text-green-400 font-medium' : 'text-text-secondary'}>{label}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${done ? 'bg-green-100 text-green-700' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
                  {done ? 'Verified' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
          {(!profile.nidaVerified || !profile.saccoVerified) && (
            <div className="mt-3 space-y-1">
              {!profile.nidaVerified && (
                <Link href="/profile/verify" className="block w-full text-center py-2.5 text-sm text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors font-semibold">
                  Complete NIDA Verification
                </Link>
              )}
              {!profile.saccoVerified && (
                <Link href="/trust" className="block w-full text-center py-2.5 text-sm text-primary font-medium hover:underline">
                  Join a Trust Circle →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Personal info (editable) */}
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-text-primary dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Personal Info
            </h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button onClick={save} disabled={saving} className="flex items-center gap-1.5 text-xs text-white bg-primary rounded-lg px-3 py-1.5 font-medium hover:bg-primary-dark disabled:opacity-50">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="label">Full Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 7XX XXX XXX" className="input" />
              </div>
              <div>
                <label className="label">WhatsApp Number</label>
                <input value={form.whatsappNumber} onChange={e => setForm(p => ({ ...p, whatsappNumber: e.target.value }))} placeholder="+250 7XX XXX XXX" className="input" />
                <p className="text-xs text-text-light mt-1">Used for booking confirmations and host messages</p>
              </div>
              <div>
                <label className="label">Preferred Language</label>
                <select value={form.preferredLanguage} onChange={e => setForm(p => ({ ...p, preferredLanguage: e.target.value }))} className="input">
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { icon: User, label: 'Name', value: profile.name },
                { icon: Phone, label: 'Phone', value: profile.phone || '—' },
                { icon: Phone, label: 'WhatsApp', value: profile.whatsappNumber || '—' },
                { icon: Globe, label: 'Language', value: LANGUAGES.find(l => l.value === profile.preferredLanguage)?.label || profile.preferredLanguage },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <Icon className="w-4 h-4 text-text-light flex-shrink-0" />
                  <span className="text-text-secondary w-20 flex-shrink-0">{label}</span>
                  <span className="text-text-primary dark:text-white font-medium truncate">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Host stats (if host) */}
        {isHost && (
          <div className="card p-5 mb-4">
            <h2 className="font-bold text-text-primary dark:text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-accent-yellow" /> Host Stats
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="text-xl font-extrabold text-text-primary dark:text-white">{profile.totalHostTrips}</div>
                <div className="text-xs text-text-secondary mt-0.5">Total Trips</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="text-xl font-extrabold text-text-primary dark:text-white">{profile.responseRate}%</div>
                <div className="text-xs text-text-secondary mt-0.5">Response Rate</div>
              </div>
              <div className={`rounded-xl p-3 ${profile.superhostSince ? 'bg-primary-light dark:bg-primary/10' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className={`text-xl font-extrabold ${profile.superhostSince ? 'text-primary' : 'text-text-light'}`}>
                  {profile.superhostSince ? '★' : '—'}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">Superhost</div>
              </div>
            </div>
            <Link href="/dashboard/host" className="flex items-center justify-between mt-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <span className="text-sm text-text-secondary">Host Dashboard</span>
              <ChevronRight className="w-4 h-4 text-text-light" />
            </Link>
          </div>
        )}

        {/* Quick links */}
        <div className="card p-5 mb-4">
          <h2 className="font-bold text-text-primary dark:text-white mb-3">My Activity</h2>
          <div className="space-y-1">
            {[
              { href: '/dashboard', icon: Car, label: 'My Bookings' },
              ...(profile.isSeller ? [{ href: '/sell', icon: Tag, label: 'My Listings' }] : []),
              ...(profile.isInvestor ? [{ href: '/earn', icon: TrendingUp, label: 'Buy & Earn' }] : []),
              { href: '/financing', icon: Building2, label: 'Drive to Own' },
              { href: '/trust', icon: ShieldCheck, label: 'Trust Circle' },
              { href: '/messages', icon: Bell, label: 'Messages' },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3 text-sm">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-text-secondary">{label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-light" />
              </Link>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
