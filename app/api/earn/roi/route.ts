/**
 * GET /api/earn/roi?make=Toyota&model=Vitz&year=2016&purchasePrice=8200000
 * Returns a live ROI calculation using real Gari listing data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateROI, getComparableRate } from '@/lib/roi';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get('make') || '';
  const model = searchParams.get('model') || '';
  const year = Number(searchParams.get('year') || '2020');
  const purchasePrice = Number(searchParams.get('purchasePrice') || '0');
  const repairCost = Number(searchParams.get('repairCost') || '0');
  const registrationCost = Number(searchParams.get('registrationCost') || '150000');
  const importDuties = Number(searchParams.get('importDuties') || '0');
  const occupancyPct = Number(searchParams.get('occupancyPct') || process.env.DEFAULT_OCCUPANCY_PCT || '65');
  const maintenancePct = Number(searchParams.get('maintenancePct') || process.env.MAINTENANCE_RESERVE_PCT || '10');

  const comparable = await getComparableRate(make, model, year, prisma);

  const result = calculateROI({
    vehiclePurchasePriceRwf: purchasePrice,
    estimatedRepairCostRwf: repairCost,
    registrationCostRwf: registrationCost,
    importDutiesRwf: importDuties,
    comparableDailyRateRwf: comparable.rate,
    comparableListingsCount: comparable.count,
    occupancyPct,
    maintenanceReservePct: maintenancePct,
  });

  return NextResponse.json({ ...result, comparableDailyRate: comparable.rate, comparableCount: comparable.count });
}
