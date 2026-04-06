'use client';

import { Volume2, VolumeX, Settings, X, Loader2, Check } from 'lucide-react';
import type { POIPreferences } from './useLocationAwareness';

interface Props {
  open: boolean;
  onClose: () => void;
  preferences: POIPreferences;
  onChange: (prefs: POIPreferences) => void;
  isSaving?: boolean;
  announcedCount: number;
}

const CATEGORIES = [
  { id: 'food',       emoji: '🍽️', label: 'Food & Drink' },
  { id: 'hotel',      emoji: '🏨', label: 'Hotels' },
  { id: 'landmark',   emoji: '🏛️', label: 'Landmarks' },
  { id: 'religious',  emoji: '⛪', label: 'Places of Worship' },
  { id: 'healthcare', emoji: '🏥', label: 'Healthcare' },
  { id: 'transport',  emoji: '⛽', label: 'Fuel & Parking' },
  { id: 'shopping',   emoji: '🛒', label: 'Shopping' },
  { id: 'finance',    emoji: '🏦', label: 'Banks & ATMs' },
];

const FREQUENCIES = [
  { id: 'low',    label: 'Low',    desc: '2 per min' },
  { id: 'medium', label: 'Medium', desc: '4 per min' },
  { id: 'high',   label: 'High',   desc: '6 per min' },
];

const RADII = [
  { value: 100,  label: '100m' },
  { value: 150,  label: '150m' },
  { value: 200,  label: '200m' },
  { value: 300,  label: '300m' },
];

export function POISettingsPanel({ open, onClose, preferences, onChange, isSaving, announcedCount }: Props) {
  if (!open) return null;

  function toggleCategory(id: string) {
    const cats = preferences.categories.includes(id)
      ? preferences.categories.filter(c => c !== id)
      : [...preferences.categories, id];
    onChange({ ...preferences, categories: cats });
  }

  return (
    <div className="absolute inset-0 z-[1002] bg-black/50 flex items-end">
      <div className="bg-white dark:bg-gray-900 w-full rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-extrabold text-lg text-text-primary dark:text-white">Location Awareness</h3>
            </div>
            <button onClick={onClose} className="text-text-secondary p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Audio toggle — primary feature */}
          <button
            onClick={() => onChange({ ...preferences, audioEnabled: !preferences.audioEnabled })}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all mb-5 ${
              preferences.audioEnabled
                ? 'border-primary bg-primary-light dark:bg-primary/10'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              preferences.audioEnabled ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              {preferences.audioEnabled
                ? <Volume2 className="w-6 h-6 text-white" />
                : <VolumeX className="w-6 h-6 text-text-secondary" />}
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-text-primary dark:text-white">
                Audio Guide {preferences.audioEnabled ? 'ON' : 'OFF'}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">
                {preferences.audioEnabled
                  ? `Announcing nearby places automatically · ${announcedCount} announced`
                  : 'Tap to hear nearby places as you move'}
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${preferences.audioEnabled ? 'bg-primary' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${preferences.audioEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {/* Detection radius */}
          <div className="mb-5">
            <label className="label">Detection Radius</label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {RADII.map(r => (
                <button
                  key={r.value}
                  onClick={() => onChange({ ...preferences, radius: r.value })}
                  className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                    preferences.radius === r.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Announcement frequency */}
          {preferences.audioEnabled && (
            <div className="mb-5">
              <label className="label">Announcement Frequency</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {FREQUENCIES.map(f => (
                  <button
                    key={f.id}
                    onClick={() => onChange({ ...preferences, frequency: f.id as 'low' | 'medium' | 'high' })}
                    className={`flex flex-col items-center py-3 rounded-xl transition-all ${
                      preferences.frequency === f.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    <span className="font-bold text-sm">{f.label}</span>
                    <span className={`text-xs mt-0.5 ${preferences.frequency === f.id ? 'text-primary-light' : 'text-text-light'}`}>
                      {f.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="mb-5">
            <label className="label">Show Categories</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {CATEGORIES.map(cat => {
                const active = preferences.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 transition-all text-left ${
                      active
                        ? 'border-primary bg-primary-light dark:bg-primary/10'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <span className={`text-xs font-semibold flex-1 ${active ? 'text-primary' : 'text-text-secondary'}`}>
                      {cat.label}
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={onClose}
            disabled={isSaving}
            className="btn-primary w-full justify-center py-3"
          >
            {isSaving ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </span>
            ) : 'Done'}
          </button>

          <p className="text-xs text-center text-text-light mt-3">
            Audio uses your device's built-in Text-to-Speech. No data sent to external servers.
          </p>
        </div>
      </div>
    </div>
  );
}
