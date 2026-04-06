/**
 * GET /api/cron/roi-update
 * Nightly cron: recalculate ROI snapshots for all active Buy & Earn listings.
 * Schedule in vercel.json: "0 2 * * *" (02:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateROI, getComparableRate } from '@/lib/roi';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret === 'placeholder') return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return new NextResponse('Forbidden', { status: 403 });

  const listings = await prisma.buyEarnListing.findMany({ where: { isActive: true } });

  let updated = 0;
  for (const listing of listings) {
    try {
      const { rate, count } = await getComparableRate(listing.make, listing.model, listing.year, prisma);
      const roi = calculateROI({
        vehiclePurchasePriceRwf: listing.purchasePriceRwf,
        estimatedRepairCostRwf: listing.repairCostRwf,
        registrationCostRwf: listing.registrationCostRwf,
        importDutiesRwf: listing.importDutiesRwf,
        comparableDailyRateRwf: rate,
        comparableListingsCount: count,
        occupancyPct: listing.occupancyPct,
        maintenanceReservePct: listing.maintenanceReservePct,
      });

      await prisma.buyEarnListing.update({
        where: { id: listing.id },
        data: { roiData: roi as any, roiConfidence: roi.confidence, comparableDailyRate: rate },
      });
      updated++;
    } catch (err) {
      console.error(`[ROI Cron] Failed for listing ${listing.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, updated });
}
