'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Camera, Upload, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function DamageReportPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // In production, upload to Supabase/Cloudinary and get URLs
  // For now, accept URL input directly
  const [urlInput, setUrlInput] = useState('');

  const addPhoto = () => {
    if (urlInput.trim()) {
      setPhotoUrls(prev => [...prev, urlInput.trim()]);
      setUrlInput('');
    }
  };

  const removePhoto = (i: number) => {
    setPhotoUrls(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe the damage');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${params.bookingId}/damage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, photos: photoUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
      toast.success('Damage report submitted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-bg dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary dark:text-white mb-2">Report Submitted</h1>
          <p className="text-text-secondary mb-6">
            The renter has been notified. The security deposit will be reviewed by our team within 24 hours.
          </p>
          <Link href="/dashboard/host" className="btn-primary">Go to Host Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/dashboard/host" className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary dark:text-white">File Damage Report</h1>
              <p className="text-sm text-text-secondary">Booking: {params.bookingId.slice(0, 12).toUpperCase()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Description */}
            <div>
              <label className="label">Damage Description *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what was damaged, where it is on the vehicle, and estimated severity..."
                className="input w-full resize-none"
                required
              />
            </div>

            {/* Photo evidence */}
            <div>
              <label className="label flex items-center gap-2">
                <Camera className="w-4 h-4" /> Photo Evidence
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="Paste photo URL (Supabase, Cloudinary...)"
                  className="input flex-1 text-sm"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhoto())}
                />
                <button type="button" onClick={addPhoto} className="btn-secondary text-sm px-3">
                  Add
                </button>
              </div>

              {photoUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        className="w-20 h-16 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-text-light mt-1">
                Photos will be shared with both the renter and our support team
              </p>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-400">
              <strong>Important:</strong> Filing a false damage report may result in account suspension.
              Our team will review all claims within 24 hours and may contact both parties.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center py-3"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                'Submit Damage Report'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
