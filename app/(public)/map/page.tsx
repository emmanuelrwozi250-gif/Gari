import type { Metadata } from 'next';
import { MapWithDistricts } from '@/components/map/MapWithDistricts';

export const metadata: Metadata = {
  title: 'Car Rental Map — Rwanda · Gari',
  description: 'Find available cars near you across all Rwanda districts on the Gari mobility map.',
};

export default function MapPage() {
  return <MapWithDistricts />;
}
