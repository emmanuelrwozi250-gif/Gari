'use client';

import { useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Camera, Upload, CheckCircle, AlertTriangle, XCircle,
  ChevronLeft, Loader2, Shield, Zap, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

type Stage = 'pickup' | 'return';
type Condition = 'excellent' | 'good' | 'fair' | 'poor';

interface DamageItem {
  location: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
}

interface InspectionResult {
  condition: Condition;
  damages: DamageItem[];
  recommendation: string;
  confidence: number;
  stage: Stage;
  inspectedAt: string;
  photoCount: number;
}

const CONDITION_CONFIG: Record<Condition, { label: string; color: string; icon: typeof CheckCircle }> = {
  excellent: { label: 'Excellent', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle },
  good:      { label: 'Good',      color: 'text-blue-600 bg-blue-50 border-blue-200',   icon: CheckCircle },
  fair:      { label: 'Fair',      color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: AlertTriangle },
  poor:      { label: 'Poor',      color: 'text-red-600 bg-red-50 border-red-200',      icon: XCircle },
};

const SEVERITY_COLORS: Record<string, string> = {
  minor:    'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800',
  major:    'bg-red-100 text-red-800',
};

const PHOTO_TIPS = [
  'Front bumper & grille',
  'Rear bumper & boot',
  'Driver-side doors & panels',
  'Passenger-side doors & panels',
  'Roof & windscreen',
  'Interior dashboard & seats',
];

export default function InspectPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const searchParams = useSearchParams();
  const defaultStage = (searchParams.get('stage') as Stage) || 'pickup';

  const [stage, setStage] = useState<Stage>(defaultStage);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [damageDesc, setDamageDesc] = useState('');
  const [filingDamage, setFilingDamage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'inspection-photos');

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url as string;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 10 - photos.length;
    if (remaining <= 0) { toast.error('Maximum 10 photos per inspection'); return; }

    setUploading(true);
    try {
      const toUpload = Array.from(files).slice(0, remaining);
      const urls = await Promise.all(toUpload.map(uploadPhoto));
      setPhotos(prev => [...prev, ...urls]);
      toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} added`);
    } catch {
      toast.error('Failed to upload one or more photos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const runInspection = async () => {
    if (photos.length < 2) {
      toast.error('Add at least 2 photos for a reliable inspection');
      return;
    }
    setAnalysing(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrls: photos, stage }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Inspection failed');
      }
      const data: InspectionResult = await res.json();
      setResult(data);
      toast.success('AI inspection complete');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Inspection failed');
    } finally {
      setAnalysing(false);
    }
  };

  const fileDamageReport = async () => {
    if (!damageDesc.trim()) { toast.error('Please describe the damage'); return; }
    setFilingDamage(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/damage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos, description: damageDesc }),
      });
      if (!res.ok) throw new Error('Failed to file report');
      toast.success('Damage report filed. Renter has been notified.');
      setDamageDesc('');
    } catch {
      toast.error('Failed to file damage report');
    } finally {
      setFilingDamage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 pb-16">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary dark:text-white">Vehicle Inspection</h1>
            <p className="text-xs text-text-secondary">Booking {bookingId.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" /> AI-powered
          </div>
        </div>

        {/* Stage selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['pickup', 'return'] as Stage[]).map(s => (
            <button
              key={s}
              onClick={() => { setStage(s); setResult(null); setPhotos([]); }}
              className={`py-3 rounded-xl font-semibold text-sm border-2 transition-colors capitalize ${
                stage === s
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-text-secondary hover:border-primary'
              }`}
            >
              {s === 'pickup' ? '🔑 Pickup Inspection' : '🔁 Return Inspection'}
            </button>
          ))}
        </div>

        {!result ? (
          <>
            {/* Photo tips */}
            <div className="card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-semibold text-sm text-text-primary dark:text-white">
                  Photograph these areas ({photos.length}/10)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PHOTO_TIPS.map(tip => (
                  <div key={tip} className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            {/* Photo grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {photos.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-200">
                    <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < 10 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-text-light hover:border-primary hover:text-primary transition-colors"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    <span className="text-xs">Add</span>
                  </button>
                )}
              </div>
            )}

            {/* Upload area */}
            {photos.length === 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center gap-3 text-text-secondary hover:border-primary hover:text-primary transition-colors mb-4"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8" />
                    <div className="text-center">
                      <p className="font-semibold text-sm">Tap to add photos</p>
                      <p className="text-xs text-text-light mt-1">JPEG, PNG, WebP · Max 10MB each · Up to 10 photos</p>
                    </div>
                  </>
                )}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />

            <button
              onClick={runInspection}
              disabled={photos.length < 2 || analysing}
              className="btn-primary w-full justify-center py-3.5 text-base font-bold disabled:opacity-60"
            >
              {analysing ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analysing with AI...</>
              ) : (
                <><Shield className="w-5 h-5 mr-2" /> Run AI Inspection</>
              )}
            </button>
            {photos.length < 2 && (
              <p className="text-xs text-text-light text-center mt-2">Add at least 2 photos to run inspection</p>
            )}
          </>
        ) : (
          /* Results panel */
          <div className="space-y-5">
            {/* Condition badge */}
            <div className={`card p-5 border ${CONDITION_CONFIG[result.condition].color}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {(() => { const Icon = CONDITION_CONFIG[result.condition].icon; return <Icon className="w-5 h-5" />; })()}
                  <span className="font-bold text-lg">{CONDITION_CONFIG[result.condition].label} Condition</span>
                </div>
                <span className="text-xs font-medium opacity-70">
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              </div>
              <p className="text-sm leading-relaxed">{result.recommendation}</p>
              <p className="text-xs opacity-60 mt-2">
                {result.photoCount} photos · {result.stage} inspection · {new Date(result.inspectedAt).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Damages */}
            {result.damages.length > 0 ? (
              <div className="card p-5">
                <h3 className="font-bold text-text-primary dark:text-white mb-3">
                  Damage Found ({result.damages.length})
                </h3>
                <div className="space-y-3">
                  {result.damages.map((d, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${SEVERITY_COLORS[d.severity]}`}>
                        {d.severity}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text-primary dark:text-white">{d.location}</p>
                        <p className="text-xs text-text-secondary">{d.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card p-5 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold text-text-primary dark:text-white text-sm">No damage detected</p>
                  <p className="text-xs text-text-secondary">AI found no visible damage in the submitted photos.</p>
                </div>
              </div>
            )}

            {/* Damage report form — only on return with damage */}
            {stage === 'return' && result.damages.length > 0 && (
              <div className="card p-5 border border-red-200 dark:border-red-800">
                <h3 className="font-bold text-text-primary dark:text-white mb-1">File Damage Report</h3>
                <p className="text-xs text-text-secondary mb-3">
                  This will notify the renter and place their deposit under review.
                </p>
                <textarea
                  value={damageDesc}
                  onChange={e => setDamageDesc(e.target.value)}
                  placeholder="Describe the damage in detail — location, extent, how it differs from pickup condition..."
                  className="input text-sm h-24 resize-none w-full mb-3"
                />
                <button
                  onClick={fileDamageReport}
                  disabled={filingDamage || !damageDesc.trim()}
                  className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2"
                >
                  {filingDamage ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  File Damage Report
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setResult(null); setPhotos([]); }}
                className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors"
              >
                Re-inspect
              </button>
              <Link href="/dashboard" className="flex-1 btn-primary justify-center py-3 text-sm">
                Done
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
