import type { Metadata } from 'next';
import { InvestorsClient } from '@/components/InvestorsClient';

export const metadata: Metadata = {
  title: 'Investors | Gari',
  robots: { index: false, follow: false },
};

export default function InvestorsPage() {
  return <InvestorsClient />;
}
