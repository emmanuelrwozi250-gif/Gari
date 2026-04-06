'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { reverseGeocode, getNearestDistrict } from '@/lib/geocoding';
import type { District } from '@/lib/districts';

export interface LocationFound {
  lat: number;
  lng: number;
  address: string;
  district: District;
}

interface GPSButtonProps {
  onLocationFound: (location: LocationFound) => void;
  className?: string;
  label?: string;
}

export function GPSButton({ onLocationFound, className = '', label = 'Use My Location' }: GPSButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude: lat, longitude: lng } = position.coords;
          const [address, district] = await Promise.all([
            reverseGeocode(lat, lng),
            Promise.resolve(getNearestDistrict(lat, lng)),
          ]);
          onLocationFound({ lat, lng, address, district });
          toast.success(`Location detected: ${district.name}`);
        } catch {
          toast.error('Could not detect location. Please select manually.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location access denied. Please enable location in your browser settings.');
        } else {
          toast.error('Could not detect location. Please select manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleGPS}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary border border-primary/30 bg-primary-light hover:bg-primary/10 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MapPin className="w-4 h-4" />
      )}
      {loading ? 'Detecting...' : label}
    </button>
  );
}
