'use client';

import { useState, useEffect } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface HostIntlSettings {
  speaksEnglish: boolean;
  speaksFrench: boolean;
  airportPickup: boolean;
  internationalReady: boolean;
}

export function InternationalHostSettings() {
  const [settings, setSettings] = useState<HostIntlSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/profile/international-settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setSettings(data))
      .catch(() => {});
  }, []);

  async function toggle(field: keyof HostIntlSettings) {
    if (!settings) return;
    const updated = { ...settings, [field]: !settings[field] };
    // Auto-set internationalReady if any of the sub-fields are set
    updated.internationalReady = updated.speaksEnglish || updated.airportPickup;
    setSettings(updated);
    setSaving(true);
    try {
      const res = await fetch('/api/profile/international-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
      setSettings(settings); // revert
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-2" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
      </div>
    );
  }

  const TOGGLES: Array<{ field: keyof HostIntlSettings; label: string; desc: string; emoji: string }> = [
    { field: 'speaksEnglish', label: 'English-speaking service', desc: 'I can communicate in English with international renters', emoji: '🇬🇧' },
    { field: 'speaksFrench', label: 'French-speaking service', desc: 'Je peux communiquer en français', emoji: '🇫🇷' },
    { field: 'airportPickup', label: 'Airport pickup available', desc: 'I can meet renters at Kigali International Airport (RIA)', emoji: '✈️' },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-text-primary dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" /> International Hosting
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-text-light" />}
        </h3>
        {settings.internationalReady && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
            🌍 Active
          </span>
        )}
      </div>
      <p className="text-xs text-text-secondary mb-4">
        Enable these to receive the 🌍 <strong>International Friendly</strong> badge on your listings.
      </p>
      <div className="space-y-3">
        {TOGGLES.map(({ field, label, desc, emoji }) => (
          <button
            key={field}
            type="button"
            onClick={() => toggle(field)}
            disabled={saving}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl border transition-colors text-left disabled:opacity-70 ${
              settings[field]
                ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-border hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">{emoji}</span>
              <div>
                <p className="text-sm font-medium text-text-primary dark:text-white">{label}</p>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
            </div>
            <span className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ml-3 ${
              settings[field] ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                settings[field] ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
