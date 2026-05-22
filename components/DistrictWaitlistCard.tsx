'use client';

import { MapPin } from 'lucide-react';
import { NewsletterSignup } from './NewsletterSignup';
import { RWANDA_DISTRICTS } from '@/lib/districts';

interface DistrictWaitlistCardProps {
  district: string;
}

export function DistrictWaitlistCard({ district }: DistrictWaitlistCardProps) {
  const districtInfo = RWANDA_DISTRICTS.find(d => d.id === district.toUpperCase());
  const districtName = districtInfo?.name || district;

  return (
    <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-text-primary dark:text-white">
          More cars coming to {districtName}
        </h3>
      </div>
      <p className="text-sm text-text-secondary dark:text-gray-400 mb-4 max-w-sm mx-auto">
        We&apos;re growing our fleet in {districtName}. Be the first to know when new cars become available.
      </p>
      <div className="max-w-sm mx-auto">
        <NewsletterSignup
          district={district}
          placeholder={`Get notified for ${districtName}`}
        />
      </div>
    </div>
  );
}
