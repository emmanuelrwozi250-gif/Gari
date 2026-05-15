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
    const { pickupDate, returnDate } = body as {
      pickupDate?: string;
      returnDate?: string;
    };

    if (!pickupDate || !returnDate) {
      return NextResponse.json(
        { error: 'pickupDate and returnDate are required' },
        { status: 400 }
      );
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);

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

    return NextResponse.json({
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
