import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const include = {
      host: { select: { id: true, name: true, avatar: true, createdAt: true, nidaVerified: true } },
      reviews: {
        include: { reviewer: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' as const },
      },
    };
    // Try by id first, then fall back to slug for SEO-friendly URLs
    let car = await prisma.car.findUnique({ where: { id: params.id }, include });
    if (!car) {
      car = await prisma.car.findUnique({ where: { slug: params.id }, include });
    }
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    return NextResponse.json(car);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch car' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const car = await prisma.car.findUnique({ where: { id: params.id }, select: { hostId: true } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    if (car.hostId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const raw = await req.json();
    // Whitelist editable fields — prevent hosts from setting isVerified, isFeatured, rating, hostId, etc.
    const allowed = [
      'make','model','year','type','listingType','seats','fuel','transmission','mileage',
      'hasAC','features','description','rules','photos','district','pickupLocation',
      'pricePerDay','driverAvailable','driverMandatory','driverPricePerDay',
      'pricingMode','instantBooking','isAvailable','internationalFriendly','airportPickup','slug',
    ] as const;
    const safeData = Object.fromEntries(
      allowed.filter(k => k in raw && raw[k] !== undefined).map(k => [k, raw[k]])
    );
    const updated = await prisma.car.update({ where: { id: params.id }, data: safeData });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update car' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const car = await prisma.car.findUnique({ where: { id: params.id }, select: { hostId: true } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    if (car.hostId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.car.update({ where: { id: params.id }, data: { isAvailable: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete car' }, { status: 500 });
  }
}
