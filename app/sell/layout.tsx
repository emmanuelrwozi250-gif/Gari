import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell Your Car Fast in Rwanda · Gari',
  description: 'List your car for free and reach thousands of verified buyers across all 30 Rwanda districts.',
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
