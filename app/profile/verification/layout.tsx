import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Your Identity · Gari',
  description: 'Upload your ID and driving permit to start renting cars on Gari.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
