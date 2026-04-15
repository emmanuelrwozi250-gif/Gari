import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Earn with Your Car in Rwanda · Gari',
  description: 'List your car on Gari and earn RWF 400,000–1,200,000 per month in passive rental income.',
};

export default function EarnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
