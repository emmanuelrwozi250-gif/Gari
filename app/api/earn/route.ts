/**
 * GET  /api/earn — list active Buy & Earn listings with ROI data
 * POST /api/earn — admin: create a new Buy & Earn listing (with ROI pre-calculation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateROI } from '@/lib/roi';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const district = searchParams.get('district');

  const listings = await prisma.buyEarnListing.findMany({
    where: {
      isActive: true,
      ...(type && { type: type as any }),
      ...(district && { district }),
    },
    orderBy: { createdAt: 'desc' },
    take: 24,
  });

  return NextResponse.json(listings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      make, model, year, type, photos,
      purchasePriceRwf, repairCostRwf = 0, registrationCostRwf = 0, importDutiesRwf = 0,
      comparableDailyRate, occupancyPct = 65, maintenanceReservePct = 10,
      district, carId,
    } = body;

    if (!make || !model || !year || !type || !purchasePriceRwf || !comparableDailyRate || !district) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Pre-calculate ROI so the public earn page displays immediately
    const roi = calculateROI({
      vehiclePurchasePriceRwf: Number(purchasePriceRwf),
      estimatedRepairCostRwf: Number(repairCostRwf),
      registrationCostRwf: Number(registrationCostRwf),
      importDutiesRwf: Number(importDutiesRwf),
      comparableDailyRateRwf: Number(comparableDailyRate),
      comparableListingsCount: 3, // treat as medium confidence for manually-entered rate
      occupancyPct: Number(occupancyPct),
      maintenanceReservePct: Number(maintenanceReservePct),
    });

    const listing = await prisma.buyEarnListing.create({
      data: {
        make,
        model,
        year: Number(year),
        type,
        photos: photos || [],
        purchasePriceRwf: Number(purchasePriceRwf),
        repairCostRwf: Number(repairCostRwf),
        registrationCostRwf: Number(registrationCostRwf),
        importDutiesRwf: Number(importDutiesRwf),
        comparableDailyRate: Number(comparableDailyRate),
        occupancyPct: Number(occupancyPct),
        maintenanceReservePct: Number(maintenanceReservePct),
        roiData: roi as any,
        roiConfidence: roi.confidence,
        district,
        ...(carId && { carId }),
        isActive: true,
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/earn]', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, isActive, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const updated = await prisma.buyEarnListing.update({
      where: { id },
      data: { isActive: isActive !== undefined ? isActive : undefined, ...rest },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
