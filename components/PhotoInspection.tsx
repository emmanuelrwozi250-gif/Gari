'use client';

import { useState } from 'react';
import { Camera, CheckCircle, AlertTriangle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface DamageItem {
  location: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
}

interface InspectionResult {
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  damages: DamageItem[];
  recommendation: string;
  confidence: number;
  stage: 'pickup' | 'return';
  inspectedAt: string;
  photoCount: number;
}

interface Props {
  bookingId: string;
  stage: 'pickup' | 'return';
  existingReport?: InspectionResult | null;
  onComplete?: (result: InspectionResult) => void;
}

const CONDITION_CONFIG = {
  excellent: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, label: 'Excellent' },
  good: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle, label: 'Good' },
  fair: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, label: 'Fair' },
  poor: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'Poor' },
};

const SEVERITY_COLORS = {
  minor: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800',
  major: 'bg-red-100 text-red-800',
};

export function PhotoInspection({ bookingId, stage, existingReport, onComplete }: Props) {
  const [photoUrls, setPhotoUrls] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InspectionResult | null>(existingReport || null);
  const [showForm, setShowForm] = useState(!existingReport);

  const stageLabel = stage === 'pickup' ? 'Pickup' : 'Return';

  function addPhotoField() {
    if (photoUrls.length < 8) setPhotoUrls(prev => [...prev, '']);
  }

  function updateUrl(idx: number, val: string) {
    setPhotoUrls(prev => prev.map((u, i) => (i === idx ? val : u)));
  }

  function removeUrl(idx: number) {
    setPhotoUrls(prev => prev.filter((_, i) => i !== idx));
  }

  async function runInspection() {
    const validUrls = photoUrls.filter(u => u.trim().length > 0);
    if (validUrls.length === 0) {
      toast.error('Add at least one photo URL');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrls: validUrls, stage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Inspection failed');
      setResult(data);
      setShowForm(false);
      onComplete?.(data);
      toast.success('AI inspection complete');
    } catch (err: any) {
      toast.error(err.message || 'Inspection failed');
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? CONDITION_CONFIG[result.condition] : null;
  const ConditionIcon = cfg?.icon;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Camera size={18} className="text-primary" />
          <span className="font-semibold text-gray-900">{stageLabel} Inspection</span>
          {result && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg?.bg} ${cfg?.color}`}>
              {cfg?.label}
            </span>
          )}
        </div>
        {result && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {showForm ? 'Hide' : 'Re-inspect'}
            {showForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Photo URL inputs */}
      {showForm && (
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600">
            Enter photo URLs for the {stageLabel.toLowerCase()} inspection. Upload photos to your preferred image host and paste the URLs below.
          </p>
          {photoUrls.map((url, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={e => updateUrl(idx, e.target.value)}
                placeholder={`Photo ${idx + 1} URL (https://...)`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {photoUrls.length > 1 && (
                <button onClick={() => removeUrl(idx)} className="text-red-400 hover:text-red-600 px-2">
                  <XCircle size={16} />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-3">
            {photoUrls.length < 8 && (
              <button
                onClick={addPhotoField}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                + Add photo
              </button>
            )}
            <button
              onClick={runInspection}
              disabled={loading}
              className="ml-auto flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Analysing...</>
              ) : (
                <><Camera size={15} /> Run AI Inspection</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="p-5 space-y-4">
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${cfg?.bg} ${cfg?.border}`}>
            {ConditionIcon && <ConditionIcon size={20} className={`${cfg?.color} flex-shrink-0 mt-0.5`} />}
            <div className="flex-1">
              <p className={`font-semibold ${cfg?.color}`}>
                Condition: {cfg?.label}
              </p>
              <p className="text-sm text-gray-700 mt-1">{result.recommendation}</p>
              <p className="text-xs text-gray-500 mt-1">
                AI confidence: {Math.round(result.confidence * 100)}% · {result.photoCount} photo{result.photoCount !== 1 ? 's' : ''} analysed
              </p>
            </div>
          </div>

          {result.damages.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Damage Found</p>
              <div className="space-y-2">
                {result.damages.map((d, i) => (
                  <div key={i} className="flex items-start justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{d.location}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-3 flex-shrink-0 ${SEVERITY_COLORS[d.severity]}`}>
                      {d.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.damages.length === 0 && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
              No damage detected in the provided photos.
            </p>
          )}

          <p className="text-xs text-gray-400">
            Inspected: {new Date(result.inspectedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
