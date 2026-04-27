import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PushNotificationInit } from '@/components/PushNotificationInit';
import PWABanner from '@/components/PWABanner';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://gari.rw'),
  title: {
    default: 'Gari — Car Rental in Rwanda',
    template: '%s | Gari',
  },
  description:
    'Rent a car anywhere in Rwanda. Find economy, SUV, 4x4, executive and minibus vehicles for self-drive or with a driver. The leading car rental marketplace in Africa.',
  keywords: ['car rental Rwanda', 'gari', 'rent a car Kigali', 'African car rental', 'P2P car sharing'],
  openGraph: {
    title: 'Gari — Car Rental in Rwanda',
    description: 'Connecting Africa to the world — rent a car on your own terms.',
    type: 'website',
    locale: 'en_RW',
    siteName: 'Gari',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gari — Car Rental in Rwanda',
    description: 'Rent a car anywhere in Rwanda.',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a7a4a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`antialiased ${inter.className}`}>
        <Providers>
          <Navbar />
          <main className="main-content min-h-screen">
            {children}
          </main>
          <Footer />
          <MobileNav />
          <WhatsAppButton />
          <PushNotificationInit />
          <PWABanner />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#1a7a4a', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
