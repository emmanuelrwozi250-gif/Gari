/**
 * GET  /api/sales  — list sale listings (public, filterable)
 * POST /api/sales  — create a new sale listing (auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { addDays } from 'date-fns';

const TIER_DAYS: Record<string, number> = { BASIC: 30, STANDARD: 60, PREMIUM: 90 };
const TIER_PRICE: Record<string, number> = { BASIC: 0, STANDARD: 5000, PREMIUM: 15000 };

const createSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0),
  colour: z.string().min(1),
  regNumber: z.string().optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  fuel: z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC']),
  type: z.enum(['ECONOMY', 'SEDAN', 'SUV_4X4', 'EXECUTIVE', 'MINIBUS', 'PICKUP', 'LUXURY']),
  askingPrice: z.number().int().min(1),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Needs Work']),
  district: z.string().min(1),
  description: z.string().min(10),
  photos: z.array(z.string()).min(1),
  ownershipProof: z.string().optional(),
  listingTier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).default('BASIC'),
  alsoListForRent: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get('make');
  const type = searchParams.get('type') as any;
  const district = searchParams.get('district');
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const minYear = searchParams.get('minYear') ? Number(searchParams.get('minYear')) : undefined;
  const maxYear = searchParams.get('maxYear') ? Number(searchParams.get('maxYear')) : undefined;
  const condition = searchParams.get('condition');
  const transmission = searchParams.get('transmission') as any;
  const sortBy = searchParams.get('sortBy') || 'newest';
  const page = Number(searchParams.get('page') || '1');
  const limit = 20;

  const where: any = {
    status: 'AVAILABLE',
    expiresAt: { gte: new Date() },
    ...(make && { make: { contains: make, mode: 'insensitive' } }),
    ...(type && { type }),
    ...(district && { district }),
    ...(condition && { condition }),
    ...(transmission && { transmission }),
    ...(minPrice || maxPrice ? { askingPrice: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
    ...(minYear || maxYear ? { year: { ...(minYear && { gte: minYear }), ...(maxYear && { lte: maxYear }) } } : {}),
  };

  const orderBy: any =
    sortBy === 'price_asc' ? { askingPrice: 'asc' }
    : sortBy === 'price_desc' ? { askingPrice: 'desc' }
    : { createdAt: 'desc' };

  const [listings, total] = await Promise.all([
    prisma.salesListing.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { seller: { select: { name: true, nidaVerified: true, trustScore: true } } },
    }),
    prisma.salesListing.count({ where }),
  ]);

  return NextResponse.json({ listings, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const sellerId = (session.user as any).id;

    const expiresAt = addDays(new Date(), TIER_DAYS[data.listingTier]);

    const listing = await prisma.salesListing.create({
      data: {
        sellerId,
        make: data.make,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        colour: data.colour,
        regNumber: data.regNumber,
        transmission: data.transmission,
        fuel: data.fuel,
        type: data.type,
        askingPrice: data.askingPrice,
        condition: data.condition,
        district: data.district,
        description: data.description,
        photos: data.photos,
        ownershipProof: data.ownershipProof,
        listingTier: data.listingTier,
        tierPaidAmount: TIER_PRICE[data.listingTier],
        alsoListForRent: data.alsoListForRent,
        expiresAt,
      },
    });

    // Mark user as seller
    await prisma.user.update({ where: { id: sellerId }, data: { isSeller: true } });

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error('[Sales POST]', err);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
