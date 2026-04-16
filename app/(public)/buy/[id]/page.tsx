import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { DEMO_SALES_LISTINGS } from '@/lib/demo-sales';
import { BuyListingDetail } from '@/components/BuyListingDetail';
import { formatRWF } from '@/lib/utils';

// Shared type used by both server component and BuyListingDetail client component
export type ListingDisplay = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition: string;
  transmission: string;
  fuel: string;
  type: string;
  colour: string;
  regNumber?: string | null;
  askingPrice: number;
  description: string;
  photos: string[];
  inspectionDone: boolean;
  featured: boolean;
  listingTier: string;
  viewCount: number;
  district: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  seller: {
    name: string;
    phone: string;
    whatsappNumber?: string | null;
    nidaVerified: boolean;
    trustScore: number;
  };
};

async function getListing(id: string): Promise<ListingDisplay | null> {
  try {
    const row = await prisma.salesListing.findFirst({
      where: { id },
      include: {
        seller: {
          select: {
            name: true,
            phone: true,
            whatsappNumber: true,
            nidaVerified: true,
            trustScore: true,
          },
        },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      make: row.make,
      model: row.model,
      year: row.year,
      mileage: row.mileage,
      condition: row.condition,
      transmission: row.transmission as string,
      fuel: row.fuel as string,
      type: row.type as string,
      colour: row.colour,
      regNumber: row.regNumber,
      askingPrice: row.askingPrice,
      description: row.description,
      photos: row.photos,
      inspectionDone: row.inspectionDone,
      featured: row.featured,
      listingTier: row.listingTier as string,
      viewCount: row.viewCount,
      district: row.district,
      status: row.status as string,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      seller: {
        name: row.seller.name ?? 'Seller',
        phone: row.seller.phone ?? '',
        whatsappNumber: row.seller.whatsappNumber,
        nidaVerified: row.seller.nidaVerified,
        trustScore: row.seller.trustScore,
      },
    };
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id) ?? DEMO_SALES_LISTINGS.find(l => l.id === id);
  if (!listing) return { title: 'Car for Sale — Gari' };
  return {
    title: `${listing.year} ${listing.make} ${listing.model} for Sale in Rwanda — Gari`,
    description: `${listing.condition} condition ${listing.year} ${listing.make} ${listing.model} in Rwanda. Asking ${formatRWF(listing.askingPrice)}. View photos and contact the seller on Gari.`,
    openGraph: {
      title: `${listing.year} ${listing.make} ${listing.model} — ${formatRWF(listing.askingPrice)}`,
      description: `${listing.condition} · ${listing.mileage.toLocaleString()} km · ${listing.district}`,
      images: listing.photos[0] ? [{ url: listing.photos[0] }] : [],
      type: 'website',
    },
  };
}

export default async function BuyListingPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. Try DB
  let listing: ListingDisplay | null = await getListing(id);

  // 2. Fall back to demo data
  if (!listing) {
    const demo = DEMO_SALES_LISTINGS.find(l => l.id === id);
    if (demo) listing = demo as ListingDisplay;
  }

  // 3. 404 if neither found
  if (!listing) notFound();

  return <BuyListingDetail listing={listing} />;
}
