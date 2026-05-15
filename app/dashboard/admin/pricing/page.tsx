'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Plus, ToggleLeft, ToggleRight, Trash2, ArrowLeft } from 'lucide-react';

interface PricingRule {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  multiplier: number;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: number[];
  minDays: number | null;
  description: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  season: 'Season',
  holiday: 'Holiday',
  day_of_week: 'Day of Week',
  long_stay: 'Long Stay',
};

const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ruleDetail(rule: PricingRule): string {
  if (rule.type === 'season' || rule.type === 'holiday') {
    const s = rule.startDate ? rule.startDate.slice(5) : '?';
    const e = rule.endDate ? rule.endDate.slice(5) : '?';
    return `${s} → ${e}`;
  }
  if (rule.type === 'day_of_week') {
    return rule.dayOfWeek.map(d => DOW_NAMES[d] ?? d).join(', ');
  }
  if (rule.type === 'long_stay') {
    return `${rule.minDays}+ days`;
  }
  return '';
}

function multiplierBadge(m: number) {
  const pct = Math.round((m - 1) * 100);
  const label = pct >= 0 ? `+${pct}%` : `${pct}%`;
  const cls = pct > 0
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

const EMPTY_FORM = {
  name: '', type: 'season', multiplier: '1.10', priority: '5',
  startDate: '', endDate: '', dayOfWeek: [] as number[], minDays: '',
  description: '',
};

export default function AdminPricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Preview
  const [previewPickup, setPreviewPickup] = useState('');
  const [previewReturn, setPreviewReturn] = useState('');
  const [previewResult, setPreviewResult] = useState<{ finalMultiplier: number; adjustmentPercent: number; appliedRules: Array<{ name: string; delta: number }> } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      const role = (session?.user as { role?: string })?.role;
      if (role !== 'ADMIN') router.push('/dashboard');
    }
  }, [status, session, router]);

  async function loadRules() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pricing-rules');
      const data = await res.json();
      setRules(data.rules ?? []);
    } catch {
      setError('Failed to load rules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as { role?: string })?.role;
      if (role === 'ADMIN') loadRules();
    }
  }, [status, session]);

  async function toggleRule(id: string, enabled: boolean) {
    setToggling(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pricing-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !enabled } : r));
    } catch {
      setError('Failed to toggle rule');
    } finally {
      setToggling(null);
    }
  }

  async function deleteRule(id: string, name: string) {
    if (!confirm(`Delete rule "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pricing-rules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setRules(prev => prev.filter(r => r.id !== id));
    } catch {
      setError('Failed to delete rule');
    } finally {
      setDeleting(null);
    }
  }

  async function saveRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name,
        type: form.type,
        multiplier: parseFloat(form.multiplier),
        priority: parseInt(form.priority, 10),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        dayOfWeek: form.dayOfWeek,
        minDays: form.minDays ? parseInt(form.minDays, 10) : null,
        description: form.description || null,
      };
      const res = await fetch('/api/admin/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create rule');
      }
      await loadRules();
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function runPreview() {
    if (!previewPickup || !previewReturn) return;
    setPreviewing(true);
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupDate: previewPickup, returnDate: previewReturn }),
      });
      const data = await res.json();
      setPreviewResult(data);
    } catch {
      setError('Preview failed');
    } finally {
      setPreviewing(false);
    }
  }

  function toggleDow(d: number) {
    setForm(f => ({
      ...f,
      dayOfWeek: f.dayOfWeek.includes(d) ? f.dayOfWeek.filter(x => x !== d) : [...f.dayOfWeek, d],
    }));
  }

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center h-64 text-text-secondary">Loading…</div>;
  }

  const byType = (t: string) => rules.filter(r => r.type === t);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-text-secondary hover:text-primary flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Admin
          </Link>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> Dynamic Pricing Rules
          </h1>
          <p className="text-text-secondary text-sm mt-1">{rules.length} rules · stacking multiplier engine · 0.80–1.20 range</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Add rule form */}
      {showForm && (
        <form onSubmit={saveRule} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-text-primary">New Pricing Rule</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-text-secondary mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Eid Long Weekend" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-bg text-text-primary focus:outline-none">
                <option value="season">Season</option>
                <option value="holiday">Holiday</option>
                <option value="day_of_week">Day of Week</option>
                <option value="long_stay">Long Stay</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Multiplier * (e.g. 1.15 = +15%)</label>
              <input type="number" step="0.01" min="0.5" max="2.0" value={form.multiplier}
                onChange={e => setForm(f => ({ ...f, multiplier: e.target.value }))} required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-bg text-text-primary focus:outline-none" />
            </div>
            {(form.type === 'season' || form.type === 'holiday') && (
              <>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Start date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-bg text-text-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">End date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-bg text-text-primary focus:outline-none" />
                </div>
              </>
            )}
            {form.type === 'day_of_week' && (
              <div className="col-span-2">
                <label className="block text-xs text-text-secondary mb-1">Days of week</label>
                <div className="flex gap-2 flex-wrap">
                  {DOW_NAMES.map((name, i) => (
                    <button key={i} type="button" onClick={() => toggleDow(i)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.dayOfWeek.includes(i) ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary'}`}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {form.type === 'long_stay' && (
              <div>
                <label className="block text-xs text-text-secondary mb-1">Minimum days</label>
                <input type="number" min="1" value={form.minDays} onChange={e => setForm(f => ({ ...f, minDays: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-bg text-text-primary focus:outline-none" />
              </div>
            )}
            <div>
              <label className="block text-xs text-text-secondary mb-1">Priority (higher = applied first)</label>
              <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-bg text-text-primary focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-text-secondary mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-bg text-text-primary focus:outline-none" placeholder="Optional context" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
              {saving ? 'Saving…' : 'Create Rule'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="border border-border text-text-secondary px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-bg">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Pricing preview */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-text-primary">Pricing Preview</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Pickup date</label>
            <input type="date" value={previewPickup} onChange={e => setPreviewPickup(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-bg text-text-primary focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Return date</label>
            <input type="date" value={previewReturn} onChange={e => setPreviewReturn(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-bg text-text-primary focus:outline-none" />
          </div>
          <button onClick={runPreview} disabled={previewing || !previewPickup || !previewReturn}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
            {previewing ? 'Computing…' : 'Preview'}
          </button>
        </div>
        {previewResult && (
          <div className="mt-2 rounded-xl bg-gray-bg dark:bg-gray-800 p-3 text-sm space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              Final multiplier:
              <span className={previewResult.adjustmentPercent >= 0 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}>
                ×{previewResult.finalMultiplier.toFixed(3)} ({previewResult.adjustmentPercent > 0 ? '+' : ''}{previewResult.adjustmentPercent}%)
              </span>
            </div>
            {previewResult.appliedRules.length > 0 ? (
              previewResult.appliedRules.map((r, i) => (
                <p key={i} className="text-text-secondary text-xs">
                  • {r.name}: {r.delta > 0 ? '+' : ''}{Math.round(r.delta * 100)}%
                </p>
              ))
            ) : (
              <p className="text-text-secondary text-xs">No rules applied — base rate (×1.0)</p>
            )}
          </div>
        )}
      </div>

      {/* Rules grouped by type */}
      {(['season', 'holiday', 'day_of_week', 'long_stay'] as const).map(type => {
        const group = byType(type);
        if (group.length === 0) return null;
        return (
          <div key={type} className="space-y-2">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">{TYPE_LABELS[type]} ({group.length})</h2>
            <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
              {group.map(rule => (
                <div key={rule.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${rule.enabled ? 'bg-surface' : 'bg-gray-bg/50 dark:bg-gray-900/30'}`}>
                  {/* Toggle */}
                  <button
                    onClick={() => toggleRule(rule.id, rule.enabled)}
                    disabled={toggling === rule.id}
                    className={`shrink-0 transition-colors ${rule.enabled ? 'text-primary' : 'text-text-light'} disabled:opacity-40`}
                    title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    {rule.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${rule.enabled ? 'text-text-primary' : 'text-text-secondary line-through'}`}>{rule.name}</span>
                      {multiplierBadge(rule.multiplier)}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{ruleDetail(rule)}{rule.description ? ` — ${rule.description}` : ''}</p>
                  </div>

                  {/* Priority */}
                  <span className="text-xs text-text-light shrink-0">p{rule.priority}</span>

                  {/* Delete */}
                  <button
                    onClick={() => deleteRule(rule.id, rule.name)}
                    disabled={deleting === rule.id}
                    className="shrink-0 text-text-light hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
