'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Shield,
  BadgeCheck,
  Upload,
  CheckCircle,
  X,
  Camera,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

type KYCStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface VerificationRecord {
  id?: string;
  status: KYCStatus;
  idType?: string;
  idPhotoFrontUrl?: string | null;
  idPhotoBackUrl?: string | null;
  drivingPermitUrl?: string | null;
  selfieUrl?: string | null;
  fullNameOnId?: string | null;
  idNumber?: string | null;
  rejectionReason?: string | null;
}

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('bucket', 'kyc-docs');
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) {
    const data = await res.json() as { error?: string };
    throw new Error(data.error ?? 'Upload failed');
  }
  const data = await res.json() as { url: string };
  return data.url;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: KYCStatus }) {
  const map: Record<KYCStatus, { label: string; className: string }> = {
    UNVERIFIED: { label: 'Not submitted', className: 'bg-gray-100 dark:bg-gray-800 text-gray-500' },
    PENDING:    { label: 'Under review',  className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
    VERIFIED:   { label: 'Verified',      className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    REJECTED:   { label: 'Rejected',      className: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  };
  const { label, className } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
      {status === 'VERIFIED'   && <CheckCircle className="w-3.5 h-3.5" />}
      {status === 'PENDING'    && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {status === 'REJECTED'   && <X className="w-3.5 h-3.5" />}
      {status === 'UNVERIFIED' && <AlertCircle className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
}

// ─── Step tracker ─────────────────────────────────────────────────────────────

function StepTracker({ idFront, drivingPermit, selfie }: { idFront: boolean; drivingPermit: boolean; selfie: boolean }) {
  const steps = [
    { label: 'ID / Passport',   done: idFront },
    { label: 'Driving Permit',  done: drivingPermit },
    { label: 'Selfie with ID',  done: selfie },
  ];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2 flex-1">
          <div className={`flex items-center gap-1.5 flex-1 rounded-xl p-2.5 text-xs font-medium border transition-colors
            ${step.done
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-gray-50 dark:bg-gray-800 border-border text-text-secondary'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
              ${step.done ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
              {step.done ? '✓' : i + 1}
            </span>
            <span className="leading-tight">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-3 flex-shrink-0 rounded ${step.done ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── File upload zone ─────────────────────────────────────────────────────────

interface UploadZoneProps {
  label: string;
  hint?: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
}

function UploadZone({ label, hint, value, onChange }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="label mb-1.5">{label}</label>
      {hint && <p className="text-xs text-text-secondary mb-2">{hint}</p>}

      {value ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-green-400 dark:border-green-600 bg-gray-100 dark:bg-gray-800">
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-500/90 text-white text-xs px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" /> Uploaded
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Uploading…</span>
            </>
          ) : (
            <>
              <Camera className="w-8 h-8" />
              <div className="text-center">
                <p className="text-sm font-medium">Tap to upload photo</p>
                <p className="text-xs text-text-light mt-0.5">JPEG, PNG or WebP · max 10 MB</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium">
                <Upload className="w-3.5 h-3.5" /> Choose file
              </div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VerificationPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [idType, setIdType]               = useState<'NATIONAL_ID' | 'PASSPORT'>('NATIONAL_ID');
  const [idPhotoFrontUrl, setIdPhotoFrontUrl] = useState('');
  const [idPhotoBackUrl, setIdPhotoBackUrl]   = useState('');
  const [drivingPermitUrl, setDrivingPermitUrl] = useState('');
  const [selfieUrl, setSelfieUrl]             = useState('');
  const [fullNameOnId, setFullNameOnId]       = useState('');
  const [idNumber, setIdNumber]               = useState('');

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/login?callbackUrl=/profile/verification');
      return;
    }
    if (authStatus === 'authenticated') {
      fetch('/api/verification')
        .then(r => r.json())
        .then((data: VerificationRecord) => {
          setRecord(data);
          // Pre-fill form from existing record
          if (data.idType)           setIdType(data.idType as 'NATIONAL_ID' | 'PASSPORT');
          if (data.idPhotoFrontUrl)  setIdPhotoFrontUrl(data.idPhotoFrontUrl);
          if (data.idPhotoBackUrl)   setIdPhotoBackUrl(data.idPhotoBackUrl);
          if (data.drivingPermitUrl) setDrivingPermitUrl(data.drivingPermitUrl);
          if (data.selfieUrl)        setSelfieUrl(data.selfieUrl);
          if (data.fullNameOnId)     setFullNameOnId(data.fullNameOnId);
          if (data.idNumber)         setIdNumber(data.idNumber);
        })
        .catch(() => toast.error('Failed to load verification status'))
        .finally(() => setLoading(false));
    }
  }, [authStatus, router]);

  const kycStatus: KYCStatus = (record?.status as KYCStatus) ?? 'UNVERIFIED';

  // Required: front of ID, driving permit, selfie, full name
  // Back is only required for NATIONAL_ID
  const isFormValid =
    !!idPhotoFrontUrl &&
    (idType === 'PASSPORT' || !!idPhotoBackUrl) &&
    !!drivingPermitUrl &&
    !!selfieUrl &&
    fullNameOnId.trim().length > 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idType,
          idPhotoFrontUrl,
          idPhotoBackUrl: idType === 'NATIONAL_ID' ? idPhotoBackUrl : null,
          drivingPermitUrl,
          selfieUrl,
          fullNameOnId: fullNameOnId.trim(),
          idNumber: idNumber.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      const data = await res.json() as VerificationRecord;
      setRecord(data);
      toast.success('Documents submitted! We\'ll verify within 24 hours.');
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setIdType('NATIONAL_ID');
    setIdPhotoFrontUrl('');
    setIdPhotoBackUrl('');
    setDrivingPermitUrl('');
    setSelfieUrl('');
    setFullNameOnId('');
    setIdNumber('');
    setRecord(prev => prev ? { ...prev, status: 'UNVERIFIED' } : null);
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8 pb-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Back link */}
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Profile
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">Verify Your Identity</h1>
                <p className="text-sm text-text-secondary mt-0.5">Required before your first booking.</p>
              </div>
            </div>
            <StatusBadge status={kycStatus} />
          </div>
          <p className="text-sm text-text-secondary mt-3 pl-15">
            Your documents are encrypted and never shared with third parties.
          </p>
        </div>

        {/* ── VERIFIED STATE ── */}
        {kycStatus === 'VERIFIED' && (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-extrabold text-green-700 dark:text-green-400 mb-2">Identity Verified ✓</h2>
            <p className="text-text-secondary text-sm">You're cleared to book any car on Gari.</p>
            <Link href="/cars" className="btn-primary inline-block mt-6 px-8">Browse Cars</Link>
          </div>
        )}

        {/* ── REJECTED STATE ── */}
        {kycStatus === 'REJECTED' && (
          <div className="card p-6 mb-6 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-red-700 dark:text-red-400">Verification Failed</h3>
                {record?.rejectionReason && (
                  <p className="text-sm text-text-secondary mt-1">{record.rejectionReason}</p>
                )}
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-3 text-sm text-primary font-semibold hover:underline"
                >
                  Re-submit Documents →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PENDING STATE banner ── */}
        {kycStatus === 'PENDING' && (
          <div className="card p-5 mb-6 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-yellow-700 dark:text-yellow-400">Documents Under Review</h3>
                <p className="text-sm text-text-secondary mt-0.5">We'll notify you within 24 hours.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── FORM (show if not VERIFIED) ── */}
        {kycStatus !== 'VERIFIED' && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Step tracker */}
            <StepTracker
              idFront={!!idPhotoFrontUrl}
              drivingPermit={!!drivingPermitUrl}
              selfie={!!selfieUrl}
            />

            {/* Section A — Document type */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                Document Type
              </h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIdType('NATIONAL_ID')}
                  className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    idType === 'NATIONAL_ID'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  🪪 National ID
                </button>
                <button
                  type="button"
                  onClick={() => setIdType('PASSPORT')}
                  className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    idType === 'PASSPORT'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-text-secondary hover:border-primary/50'
                  }`}
                >
                  📘 Passport
                </button>
              </div>
            </div>

            {/* Section B — ID Front */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                {idType === 'PASSPORT' ? 'Passport Photo Page' : 'Front of National ID'}
              </h2>
              <UploadZone
                label={idType === 'PASSPORT' ? 'Photo page (the page with your face)' : 'Front of ID / Passport Photo Page'}
                value={idPhotoFrontUrl}
                onChange={url => setIdPhotoFrontUrl(url)}
              />
            </div>

            {/* Section C — ID Back (National ID only) */}
            {idType === 'NATIONAL_ID' && (
              <div className="card p-5">
                <h2 className="font-bold text-text-primary dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                  Back of National ID
                </h2>
                <UploadZone
                  label="Back of National ID"
                  value={idPhotoBackUrl}
                  onChange={url => setIdPhotoBackUrl(url)}
                />
              </div>
            )}

            {/* Section D — Driving Permit */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {idType === 'NATIONAL_ID' ? '4' : '3'}
                </span>
                Driving Permit
              </h2>
              <UploadZone
                label="Driving Permit (front page)"
                value={drivingPermitUrl}
                onChange={url => setDrivingPermitUrl(url)}
              />
            </div>

            {/* Section E — Selfie */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {idType === 'NATIONAL_ID' ? '5' : '4'}
                </span>
                Selfie with ID
              </h2>
              <UploadZone
                label="Selfie holding your ID"
                hint="Hold your ID/passport next to your face. Make sure both your face and the ID are clearly visible."
                value={selfieUrl}
                onChange={url => setSelfieUrl(url)}
              />
            </div>

            {/* Section F — Name & ID number */}
            <div className="card p-5">
              <h2 className="font-bold text-text-primary dark:text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {idType === 'NATIONAL_ID' ? '6' : '5'}
                </span>
                ID Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="label">Full name exactly as it appears on your ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={fullNameOnId}
                    onChange={e => setFullNameOnId(e.target.value)}
                    placeholder="e.g. UWIMANA Jean Pierre"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">ID / Passport number <span className="text-text-light text-xs">(optional)</span></label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={e => setIdNumber(e.target.value)}
                    placeholder="e.g. 1 1985 8 0013456 7 89"
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Section G — Submit */}
            <button
              type="submit"
              disabled={!isFormValid || submitting || kycStatus === 'PENDING'}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting…
                </>
              ) : kycStatus === 'PENDING' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Review in progress…
                </>
              ) : (
                <>
                  <BadgeCheck className="w-5 h-5" />
                  Submit for Verification
                </>
              )}
            </button>

            {!isFormValid && (
              <p className="text-xs text-text-secondary text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                All required fields and photos must be provided before submitting.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
