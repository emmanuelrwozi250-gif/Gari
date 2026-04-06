/**
 * GET /api/cars/:id/pricing?pickupDate=YYYY-MM-DD&returnDate=YYYY-MM-DD
 * Returns dynamic price quote for a date range.
 * Public endpoint — no auth required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDynamicMultiplier, applyMultiplier, formatMultiplier } from '@/lib/pricing';
import { calculateBookingFees } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const pickupDate = searchParams.get('pickupDate');
  const returnDate = searchParams.get('returnDate');
  const withDriver = searchParams.get('withDriver') === 'true';

  if (!pickupDate || !returnDate) {
    return NextResponse.json({ error: 'pickupDate and returnDate are required' }, { status: 400 });
  }

  const pickup = new Date(pickupDate);
  const ret = new Date(returnDate);
  if (isNaN(pickup.getTime()) || isNaN(ret.getTime()) || ret <= pickup) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
  }

  const car = await prisma.car.findUnique({
    where: { id: params.id },
    select: { pricePerDay: true, driverPricePerDay: true, district: true, isAvailable: true },
  });

  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });

  const totalDays = Math.max(1, Math.ceil((ret.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)));

  const pricing = await getDynamicMultiplier(pickup, ret, car.district, prisma);

  const adjustedPricePerDay = applyMultiplier(car.pricePerDay, pricing.multiplier);
  const adjustedDriverPrice = withDriver && car.driverPricePerDay
    ? applyMultiplier(car.driverPricePerDay, pricing.multiplier)
    : 0;

  const fees = calculateBookingFees(adjustedPricePerDay, totalDays, adjustedDriverPrice, withDriver);

  return NextResponse.json({
    basePrice: car.pricePerDay,
    adjustedPricePerDay,
    multiplier: pricing.multiplier,
    multiplierLabel: formatMultiplier(pricing.multiplier),
    reason: pricing.reason,
    factors: pricing.factors,
    totalDays,
    ...fees,
    isAvailable: car.isAvailable,
  });
}
