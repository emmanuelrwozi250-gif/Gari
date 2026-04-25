'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Camera, ChevronLeft, CheckCircle, AlertTriangle,
  Loader2, ArrowRight, Car, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const POSITIONS = [
  { id: 'front',     label: 'Front',          emoji: '⬆️', required: true },
  { id: 'rear',      label: 'Rear',           emoji: '⬇️', required: true },
  { id: 'driver',    label: 'Driver Side',    emoji: '⬅️', required: true },
  { id: 'passenger', label: 'Passenger Side', emoji: '➡️', required: true },
  { id: 'interior',  label: 'Interior / Dash',emoji: '🪟', required: true },
  { id: 'other',     label: 'Roof / Other',   emoji: '🔼', required: false },
] as const;

type Position = (typeof POSITIONS)[number]['id'];

interface Props {
  bookingId: string;
  checkInType: 'pickup' | 'return';
  carLabel: string;
  carPhoto: string | null;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

interface SlotState {
  url: string | null;
  state: UploadState;
}

const REQUIRED_POSITIONS = POSITIONS.filter(p => p.required).map(p => p.id);

export function CheckinClient({ bookingId, checkInType, carLabel, carPhoto }: Props) {
  const router = useRouter();
  const [slots, setSlots] = useState<Record<Position, SlotState>>(() =>
    Object.fromEntries(POSITIONS.map(p => [p.id, { url: null, state: 'idle' }])) as Record<Position, SlotState>
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const completedRequired = REQUIRED_POSITIONS.filter(pid => slots[pid].url !== null).length;
  const allRequiredDone = completedRequired === REQUIRED_POSITIONS.length;
  const totalDone = POSITIONS.filter(p => slots[p.id].url !== null).length;

  async function uploadPhoto(position: Position, file: File) {
    setSlots(prev => ({ ...prev, [position]: { url: null, state: 'uploading' } }));

    try {
      // 1. Upload to storage
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', 'inspection-photos');
      const upRes = await fetch('/api/upload', { method: 'POST', body: form });
      if (!upRes.ok) throw new Error('Upload failed');
      const { url } = await upRes.json() as { url: string };

      // 2. Save InspectionPhoto record
      const saveRes = await fetch(`/api/bookings/${bookingId}/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: checkInType, position, imageUrl: url }),
      });
      if (!saveRes.ok) throw new Error('Failed to save photo');

      setSlots(prev => ({ ...prev, [position]: { url, state: 'done' } }));
    } catch (err) {
      setSlots(prev => ({ ...prev, [position]: { url: null, state: 'error' } }));
      toast.error(`Failed to upload ${position} photo — try again`);
    }
  }

  function handleFileChange(position: Position, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPhoto(position, file);
    // Reset input so same file can be re-selected after error
    e.target.value = '';
  }

  async function handleSubmit() {
    if (!allRequiredDone) {
      toast.error('Please photo all 5 required positions first');
      return;
    }
    setSubmitting(true);
    try {
      // Optionally save notes as inspection report on the booking
      if (notes.trim()) {
        await fetch(`/api/bookings/${bookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inspectionReport: { notes, completedAt: new Date().toISOString(), type: checkInType } }),
        });
      }
      setDone(true);
      setTimeout(() => router.push(`/bookings/${bookingId}`), 2000);
    } catch {
      toast.error('Failed to submit — please try again');
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
            {checkInType === 'pickup' ? 'Pick-up recorded!' : 'Return recorded!'}
          </h2>
          <p className="text-text-secondary">Redirecting to your booking…</p>
          <Loader2 className="w-5 h-5 text-text-light animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Back */}
        <Link href={`/bookings/${bookingId}`}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to booking
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">
              {checkInType === 'pickup' ? 'Pre-trip Check-in' : 'Return Check-in'}
            </h1>
          </div>
          <p className="text-sm text-text-secondary">{carLabel}</p>
        </div>

        {/* Car reference photo */}
        {carPhoto && (
          <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-6">
            <Image src={carPhoto} alt={carLabel} fill className="object-cover" sizes="512px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm font-medium">
              <Car className="w-4 h-4" /> Reference photo
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
            📸 Photo {totalDone} of {POSITIONS.length} ({completedRequired}/{REQUIRED_POSITIONS.length} required)
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {checkInType === 'pickup'
              ? 'Document the vehicle condition before you drive. These photos protect you if damage is disputed later.'
              : 'Document the vehicle as returned. Damage found beyond pick-up state will be flagged for review.'}
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-2 rounded-full bg-blue-200 dark:bg-blue-800 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedRequired / REQUIRED_POSITIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {POSITIONS.map(pos => {
            const slot = slots[pos.id];
            const isUploading = slot.state === 'uploading';
            const isError = slot.state === 'error';
            const hasPic = slot.url !== null;

            return (
              <div key={pos.id} className="relative">
                {/* Hidden file input */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={el => { fileRefs.current[pos.id] = el; }}
                  onChange={e => handleFileChange(pos.id, e)}
                  className="hidden"
                />

                <button
                  onClick={() => fileRefs.current[pos.id]?.click()}
                  disabled={isUploading}
                  className={`w-full rounded-2xl overflow-hidden border-2 transition-all aspect-[4/3] relative
                    ${hasPic ? 'border-green-500 dark:border-green-400' :
                      isError ? 'border-red-400 dark:border-red-500' :
                      'border-dashed border-border hover:border-primary/50'}`}
                >
                  {hasPic && slot.url ? (
                    // Show thumbnail
                    <Image
                      src={slot.url}
                      alt={pos.label}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center gap-2 p-3
                      ${isError ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'}`}>
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      ) : isError ? (
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                      ) : (
                        <Camera className="w-8 h-8 text-text-light" />
                      )}
                      <span className="text-xs font-medium text-text-secondary text-center leading-tight">
                        {isUploading ? 'Uploading…' : isError ? 'Tap to retry' : pos.label}
                      </span>
                    </div>
                  )}

                  {/* Overlay labels */}
                  {hasPic && (
                    <>
                      {/* Green tick */}
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      {/* Retake button */}
                      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                        <RotateCcw className="w-3.5 h-3.5 text-white" />
                      </div>
                    </>
                  )}
                </button>

                <div className="mt-1.5 flex items-center justify-between px-0.5">
                  <span className="text-xs text-text-secondary font-medium">
                    {pos.emoji} {pos.label}
                  </span>
                  {!pos.required && (
                    <span className="text-xs text-text-light bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                      optional
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notes */}
        <div className="card p-4 mb-6">
          <label className="block text-sm font-semibold text-text-primary dark:text-white mb-2">
            Notes <span className="text-text-light font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder={checkInType === 'pickup'
              ? 'Pre-existing scratches, dents, fuel level, odometer…'
              : 'Condition on return, any damage, fuel level, odometer…'}
            className="input text-sm resize-none w-full"
          />
          <div className="text-right text-xs text-text-light mt-1">{notes.length}/400</div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!allRequiredDone || submitting}
          className="btn-primary w-full justify-center py-4 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />Saving…</>
          ) : !allRequiredDone ? (
            <>{completedRequired}/{REQUIRED_POSITIONS.length} photos required — keep going</>
          ) : (
            <>Complete {checkInType === 'pickup' ? 'Pick-up' : 'Return'} Check-in
              <ArrowRight className="w-4 h-4 ml-2 inline-block" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-text-light mt-3">
          Photos are securely stored and used only for dispute resolution.
        </p>
      </div>
    </div>
  );
}
