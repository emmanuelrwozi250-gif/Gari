import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCarSlug } from '@/lib/utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const where: any = { isAvailable: true };

    const district = searchParams.get('district');
    const type = searchParams.get('type');
    const listingType = searchParams.get('listingType');
    const driver = searchParams.get('driver');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const seats = searchParams.get('seats');
    const transmission = searchParams.get('transmission');
    const sort = searchParams.get('sort') || 'rating';
    const page = parseInt(searchParams.get('page') || '1');
    const take = parseInt(searchParams.get('limit') || '12');

    if (district) where.district = district;
    if (type) where.type = type;
    if (listingType) where.listingType = listingType;
    if (driver === 'true') where.driverAvailable = true;
    if (seats) where.seats = { gte: parseInt(seats) };
    if (transmission) where.transmission = transmission;
    if (minPrice || maxPrice) {
      where.pricePerDay = {};
      if (minPrice) where.pricePerDay.gte = parseInt(minPrice);
      if (maxPrice) where.pricePerDay.lte = parseInt(maxPrice);
    }

    const orderBy: any =
      sort === 'price_asc' ? { pricePerDay: 'asc' } :
      sort === 'price_desc' ? { pricePerDay: 'desc' } :
      sort === 'newest' ? { createdAt: 'desc' } :
      { rating: 'desc' };

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        include: { host: { select: { name: true, avatar: true } } },
        orderBy,
        take,
        skip: (page - 1) * take,
      }),
      prisma.car.count({ where }),
    ]);

    return NextResponse.json({ cars, total, page, pages: Math.ceil(total / take) });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 });
  }
}

const createCarSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().min(2000).max(new Date().getFullYear() + 1),
  type: z.enum(['ECONOMY', 'SEDAN', 'SUV_4X4', 'EXECUTIVE', 'MINIBUS', 'PICKUP', 'LUXURY']),
  listingType: z.enum(['P2P', 'FLEET']),
  seats: z.number().min(2).max(50),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  fuel: z.enum(['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC']),
  pricePerDay: z.number().min(5000),
  depositAmount: z.number().min(0).default(0),
  driverAvailable: z.boolean().default(false),
  driverPricePerDay: z.number().optional(),
  description: z.string().min(20),
  features: z.array(z.string()).default([]),
  photos: z.array(z.string()).min(1),
  district: z.string().min(1),
  exactLocation: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  instantBooking: z.boolean().default(false),
  mileageLimit: z.number().optional(),
  fuelPolicy: z.string().optional(),
  smokingAllowed: z.boolean().default(false),
  hasAC: z.boolean().default(true),
  hasWifi: z.boolean().default(false),
  hasGPS: z.boolean().default(false),
  hasChildSeat: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createCarSchema.parse(body);

    const car = await prisma.car.create({
      data: { ...data, hostId: (session.user as any).id },
    });

    // Generate and store slug
    const slug = generateCarSlug(car.make, car.model, car.year, car.district, car.id);
    await prisma.car.update({ where: { id: car.id }, data: { slug } });

    // Update user role to HOST if RENTER
    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id }, select: { role: true } });
    if (user?.role === 'RENTER') {
      await prisma.user.update({ where: { id: (session.user as any).id }, data: { role: 'BOTH' } });
    }

    return NextResponse.json(car, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
