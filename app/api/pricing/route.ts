import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computePricing } from '@/lib/pricing/engine';
import type { PricingRule as EnginePricingRule } from '@/lib/pricing/engine';
import type { PricingRule as DbPricingRule } from '@prisma/client';

// ── 5-minute in-memory rule cache ────────────────────────────────────────────
let cachedRules: DbPricingRule[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getActiveRules(): Promise<DbPricingRule[]> {
  if (cachedRules && Date.now() < cacheExpiry) return cachedRules;
  cachedRules = await prisma.pricingRule.findMany({ where: { enabled: true } });
  cacheExpiry = Date.now() + CACHE_TTL;
  return cachedRules;
}

function toEngineRule(r: DbPricingRule): EnginePricingRule {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    enabled: r.enabled,
    multiplier: r.multiplier,
    priority: r.priority,
    startDate: r.startDate ?? null,
    endDate: r.endDate ?? null,
    dayOfWeek: r.dayOfWeek,
    minDays: r.minDays ?? null,
    description: r.description ?? null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept startDate/endDate (audit format) or pickupDate/returnDate (hook format)
    const rawPickup = (body.startDate ?? body.pickupDate) as string | undefined;
    const rawReturn = (body.endDate ?? body.returnDate) as string | undefined;
    const carId = body.carId as string | undefined;

    if (!rawPickup || !rawReturn) {
      return NextResponse.json(
        { error: 'startDate and endDate (or pickupDate/returnDate) are required' },
        { status: 400 }
      );
    }

    const pickup = new Date(rawPickup);
    const returnD = new Date(rawReturn);

    if (isNaN(pickup.getTime()) || isNaN(returnD.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (returnD <= pickup) {
      return NextResponse.json(
        { error: 'returnDate must be after pickupDate' },
        { status: 400 }
      );
    }

    const totalDays = Math.max(
      1,
      Math.round((returnD.getTime() - pickup.getTime()) / 86_400_000)
    );

    const dbRules = await getActiveRules();
    const engineRules = dbRules.map(toEngineRule);

    const result = computePricing({
      pickupDate: pickup,
      returnDate: returnD,
      totalDays,
      rules: engineRules,
    });

    // Optional: look up car price to compute total
    let pricePerDay: number | null = null;
    if (carId) {
      try {
        const car = await prisma.car.findUnique({
          where: { id: carId },
          select: { pricePerDay: true },
        });
        if (car) pricePerDay = car.pricePerDay;
      } catch {
        // Non-fatal — total will be omitted if car not found
      }
    }

    const total = pricePerDay !== null
      ? Math.round(pricePerDay * totalDays * result.finalMultiplier)
      : null;

    const uniqueRuleNames = result.appliedRules.map(r => r.name);

    return NextResponse.json({
      success: true,
      // Nested pricing object (audit format)
      pricing: {
        days: totalDays,
        ...(total !== null ? { total } : {}),
        averageMultiplier: result.finalMultiplier,
        adjustmentPercent: result.adjustmentPercent,
        uniqueRuleNames,
      },
      // Top-level fields (hook backward compatibility)
      finalMultiplier: result.finalMultiplier,
      adjustmentPercent: result.adjustmentPercent,
      appliedRules: result.appliedRules.map(r => ({
        ruleId: r.ruleId,
        name: r.name,
        type: r.type,
        multiplier: r.multiplier,
        delta: r.delta,
      })),
      totalDays,
      cachedAt: new Date(cacheExpiry - CACHE_TTL).toISOString(),
    });
  } catch (err) {
    console.error('[POST /api/pricing]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
