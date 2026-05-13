import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  sessionId: z.string().min(1),
  eventType: z.enum([
    'car_view',
    'car_click',
    'search',
    'collection_view',
    'booking_start',
    'booking_complete',
  ]),
  carId: z.string().optional(),
  carType: z.string().optional(),
  district: z.string().optional(),
  priceRange: z.string().optional(),
  collection: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

    // Write event (non-blocking — best-effort)
    await prisma.userEvent.create({
      data: {
        userId,
        sessionId: data.sessionId,
        eventType: data.eventType,
        carId: data.carId,
        carType: data.carType,
        district: data.district,
        priceRange: data.priceRange,
        collection: data.collection,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });

    // Asynchronously update UserPreference for authenticated users
    if (userId) {
      void updatePreference(userId, data).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Silently return 200 so client-side fire-and-forget never throws
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

async function updatePreference(
  userId: string,
  data: z.infer<typeof schema>
) {
  const existing = await prisma.userPreference.findUnique({ where: { userId } });

  const preferredTypes = existing?.preferredTypes ?? [];
  const preferredDistricts = existing?.preferredDistricts ?? [];

  // Add type to preferences if not already tracked (max 5)
  if (data.carType && !preferredTypes.includes(data.carType)) {
    preferredTypes.unshift(data.carType);
    if (preferredTypes.length > 5) preferredTypes.pop();
  }

  // Add district to preferences if not already tracked (max 5)
  if (data.district && !preferredDistricts.includes(data.district)) {
    preferredDistricts.unshift(data.district);
    if (preferredDistricts.length > 5) preferredDistricts.pop();
  }

  const safariTypes = ['SUV_4X4', 'PICKUP'];
  const safariInterest =
    (data.collection === 'gorilla-trek' ||
      data.collection === 'national-parks' ||
      (data.carType !== undefined && safariTypes.includes(data.carType))) ??
    existing?.safariInterest ??
    false;

  await prisma.userPreference.upsert({
    where: { userId },
    update: {
      preferredTypes,
      preferredDistricts,
      priceRangePref: data.priceRange ?? existing?.priceRangePref,
      safariInterest: safariInterest || (existing?.safariInterest ?? false),
      lastUpdated: new Date(),
    },
    create: {
      userId,
      preferredTypes,
      preferredDistricts,
      priceRangePref: data.priceRange,
      safariInterest,
    },
  });
}
