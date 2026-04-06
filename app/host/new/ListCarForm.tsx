'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { LocationSelector } from '@/components/LocationSelector';
import { POPULAR_LOCATIONS } from '@/lib/districts';
import {
  Car, Camera, MapPin, DollarSign, FileText, CheckCircle,
  ChevronRight, ChevronLeft, Upload, X, Loader2
} from 'lucide-react';

const STEPS = ['Car Details', 'Location', 'Photos', 'Pricing', 'Rules & Submit'];

const schema = z.object({
  make: z.string().min(1, 'Required'),
  model: z.string().min(1, 'Required'),
  year: z.number().min(2000).max(2026),
  type: z.enum(['ECONOMY', 'SEDAN', 'SUV_4X4', 'EXECUTIVE', 'MINIBUS', 'PICKUP', 'LUXURY']),
  listingType: z.enum(['P2P', 'FLEET']),
  seats: z.number().min(2).max(50),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  fuel: z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC']),
  description: z.string().min(20, 'Describe your car in at least 20 characters'),
  features: z.array(z.string()).default([]),
  district: z.string().min(1, 'Select a district'),
  exactLocation: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  photos: z.array(z.string()).min(1, 'Add at least 1 photo'),
  pricePerDay: z.number().min(5000, 'Minimum RWF 5,000/day'),
  driverAvailable: z.boolean().default(false),
  driverPricePerDay: z.number().optional(),
  instantBooking: z.boolean().default(false),
  mileageLimit: z.number().optional(),
  fuelPolicy: z.string().default('Return Full'),
  smokingAllowed: z.boolean().default(false),
  hasAC: z.boolean().default(true),
  hasWifi: z.boolean().default(false),
  hasGPS: z.boolean().default(false),
  hasChildSeat: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

const COMMON_FEATURES = ['Air Conditioning', 'GPS Tracker', 'Bluetooth Audio', 'USB Charging',
  'WiFi Hotspot', 'Child Seat', 'Roof Rack', '4WD', 'Leather Seats', 'Sunroof', 'Dash Cam'];

const CAR_MAKES = ['Toyota', 'Nissan', 'Honda', 'Mitsubishi', 'Subaru', 'Suzuki', 'Mazda', 'Hyundai', 'Kia', 'BMW', 'Mercedes', 'Land Rover', 'Other'];

export function ListCarForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: 2020, seats: 5, transmission: 'AUTOMATIC', fuel: 'PETROL',
      type: 'SEDAN', listingType: 'P2P', driverAvailable: false,
      instantBooking: false, hasAC: true, photos: [], features: [],
      fuelPolicy: 'Return Full', smokingAllowed: false,
    },
  });

  const driverAvailable = watch('driverAvailable');
  const district = watch('district');
  const pricePerDay = watch('pricePerDay');
  const type = watch('type');

  const toggleFeature = (f: string) => {
    const updated = features.includes(f) ? features.filter(x => x !== f) : [...features, f];
    setFeatures(updated);
    setValue('features', updated);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, 8)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'car-photos');
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const { url } = await res.json();
          uploaded.push(url);
        }
      }
      const newPhotos = [...photos, ...uploaded].slice(0, 8);
      setPhotos(newPhotos);
      setValue('photos', newPhotos);
      toast.success(`${uploaded.length} photo(s) uploaded`);
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (i: number) => {
    const updated = photos.filter((_, idx) => idx !== i);
    setPhotos(updated);
    setValue('photos', updated);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, photos, features }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create listing');
      }
      const car = await res.json();
      toast.success('Listing submitted for review!');
      router.push(`/cars/${car.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const stepIcons = [Car, MapPin, Camera, DollarSign, FileText];

  return (
    <div className="min-h-screen bg-gray-bg dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-text-primary dark:text-white">List Your Car</h1>
          <p className="text-text-secondary">Start earning with your car in minutes</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = stepIcons[i];
            return (
              <div key={s} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  i < step ? 'bg-primary text-white' :
                  i === step ? 'bg-primary text-white ring-4 ring-primary/20' :
                  'bg-gray-200 dark:bg-gray-700 text-text-light'
                }`}>
                  {i < step ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-xs text-text-light hidden sm:block">{s}</span>
                {i < STEPS.length - 1 && (
                  <div className={`absolute mt-4 h-0.5 w-full ${i < step ? 'bg-primary' : 'bg-gray-200'}`} style={{ display: 'none' }} />
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card p-6 mb-6">
            {/* Step 1: Car Details */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg mb-4 text-text-primary dark:text-white">Car Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Make*</label>
                    <select {...register('make')} className="input">
                      <option value="">Select make</option>
                      {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make.message}</p>}
                  </div>
                  <div>
                    <label className="label">Model*</label>
                    <input {...register('model')} placeholder="e.g. Vitz, RAV4, Prado" className="input" />
                    {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Year*</label>
                    <input type="number" {...register('year', { valueAsNumber: true })} min={2000} max={2026} className="input" />
                  </div>
                  <div>
                    <label className="label">Seats*</label>
                    <input type="number" {...register('seats', { valueAsNumber: true })} min={2} max={50} className="input" />
                  </div>
                  <div>
                    <label className="label">Type*</label>
                    <select {...register('type')} className="input">
                      <option value="ECONOMY">Economy</option>
                      <option value="SEDAN">Sedan</option>
                      <option value="SUV_4X4">SUV / 4x4</option>
                      <option value="EXECUTIVE">Executive</option>
                      <option value="MINIBUS">Minibus</option>
                      <option value="PICKUP">Pickup</option>
                      <option value="LUXURY">Luxury</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Transmission*</label>
                    <select {...register('transmission')} className="input">
                      <option value="AUTOMATIC">Automatic</option>
                      <option value="MANUAL">Manual</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Fuel*</label>
                    <select {...register('fuel')} className="input">
                      <option value="PETROL">Petrol</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="ELECTRIC">Electric</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Listing Type*</label>
                    <select {...register('listingType')} className="input">
                      <option value="P2P">P2P (My own car)</option>
                      <option value="FLEET">Fleet (Business)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Description*</label>
                  <textarea {...register('description')} rows={4} className="input resize-none"
                    placeholder="Describe your car — condition, special features, ideal use cases..." />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="label">Features</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_FEATURES.map(f => (
                      <button key={f} type="button" onClick={() => toggleFeature(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          features.includes(f) ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary'
                        }`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg mb-4 text-text-primary dark:text-white">Location</h2>
                <LocationSelector
                  value={district}
                  onChange={(id, name) => {
                    setValue('district', id);
                    if (name) setValue('exactLocation', name);
                  }}
                  onCoords={(lat, lng) => { setValue('lat', lat); setValue('lng', lng); }}
                  label="District*"
                  required
                />
                {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
                <div>
                  <label className="label">Exact Address / Area (optional)</label>
                  <input {...register('exactLocation')} placeholder="e.g. KG 11 Ave, Kimironko" className="input" />
                </div>
              </div>
            )}

            {/* Step 3: Photos */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg mb-4 text-text-primary dark:text-white">Photos</h2>
                <p className="text-sm text-text-secondary">Add at least 4 high-quality photos. Listings with great photos get 3x more bookings.</p>

                <label className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-primary bg-primary-light' : 'border-border hover:border-primary hover:bg-primary-light/50'}`}>
                  <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                  {uploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                      <span className="text-sm text-primary font-medium">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-text-light mb-2" />
                      <span className="text-sm font-medium text-text-secondary">Click to upload photos</span>
                      <span className="text-xs text-text-light">JPEG, PNG, WebP — max 10MB each</span>
                    </>
                  )}
                </label>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((p, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden group">
                        <img src={p} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded-full">Main</div>
                        )}
                        <button type="button" onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {errors.photos && <p className="text-red-500 text-xs">{errors.photos.message}</p>}
              </div>
            )}

            {/* Step 4: Pricing */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg mb-4 text-text-primary dark:text-white">Pricing & Availability</h2>
                <div>
                  <label className="label">Price per Day (RWF)*</label>
                  <input type="number" {...register('pricePerDay', { valueAsNumber: true })} min={5000} step={1000} className="input" placeholder="e.g. 60000" />
                  {errors.pricePerDay && <p className="text-red-500 text-xs mt-1">{errors.pricePerDay.message}</p>}
                  {pricePerDay && <p className="text-xs text-text-secondary mt-1">You earn ~{Math.round(pricePerDay * 0.90).toLocaleString()} RWF per day (after 10% fee)</p>}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div>
                    <div className="font-medium text-sm">Offer a driver</div>
                    <div className="text-xs text-text-secondary">Earn extra by offering a driver</div>
                  </div>
                  <button type="button"
                    onClick={() => setValue('driverAvailable', !driverAvailable)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${driverAvailable ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${driverAvailable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {driverAvailable && (
                  <div>
                    <label className="label">Driver Fee per Day (RWF)</label>
                    <input type="number" {...register('driverPricePerDay', { valueAsNumber: true })} min={0} step={1000} className="input" placeholder="e.g. 20000" />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div>
                    <div className="font-medium text-sm">Instant Booking</div>
                    <div className="text-xs text-text-secondary">Renters can book without approval</div>
                  </div>
                  <button type="button"
                    onClick={() => setValue('instantBooking', !watch('instantBooking'))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${watch('instantBooking') ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${watch('instantBooking') ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Rules */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg mb-4 text-text-primary dark:text-white">Rules & Policies</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Mileage Limit (km/day)</label>
                    <input type="number" {...register('mileageLimit', { valueAsNumber: true })} min={0} className="input" placeholder="e.g. 200 (leave blank for unlimited)" />
                  </div>
                  <div>
                    <label className="label">Fuel Policy</label>
                    <select {...register('fuelPolicy')} className="input">
                      <option value="Return Full">Return Full Tank</option>
                      <option value="Pre-Paid">Pre-Paid Fuel</option>
                      <option value="Return Same Level">Return Same Level</option>
                    </select>
                  </div>
                </div>

                {[
                  { field: 'smokingAllowed', label: 'Smoking allowed', desc: 'Allow renters to smoke in the car' },
                  { field: 'hasAC', label: 'Air Conditioning', desc: 'Car has working A/C' },
                  { field: 'hasWifi', label: 'WiFi Hotspot', desc: 'Car has mobile WiFi' },
                  { field: 'hasGPS', label: 'GPS Tracker', desc: 'Car has GPS tracking' },
                  { field: 'hasChildSeat', label: 'Child Seat', desc: 'Child seat available' },
                ].map(({ field, label, desc }) => (
                  <div key={field} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-text-secondary">{desc}</div>
                    </div>
                    <button type="button"
                      onClick={() => setValue(field as any, !watch(field as any))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${watch(field as any) ? 'bg-primary' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${watch(field as any) ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}

                <div className="p-4 bg-primary-light dark:bg-primary/10 rounded-xl text-sm text-text-secondary">
                  <p className="font-semibold text-primary mb-1">By submitting, you agree:</p>
                  <ul className="space-y-1 text-xs">
                    <li>✓ All information is accurate and the car is roadworthy</li>
                    <li>✓ Gari's <Link href="/terms" className="text-primary underline">Terms of Service</Link> and Host Policy</li>
                    <li>✓ Your listing will be reviewed within 24 hours</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary flex-1 justify-center">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="btn-primary flex-1 justify-center">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Listing'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
