import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';
import { PLATFORM } from '@/config/platform';

// POST — operator activates boost for one of their cars
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const operatorId = (session.user as { id?: string }).id;
    if (!operatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { carId, paymentRef } = await req.json();
    if (!carId) {
      return NextResponse.json({ error: 'carId is required' }, { status: 400 });
    }

    // Verify car belongs to this operator
    const car = await prisma.car.findFirst({
      where: { id: carId, hostId: operatorId },
      select: { id: true },
    });
    if (!car) {
      return NextResponse.json({ error: 'Car not found or not owned by you' }, { status: 404 });
    }

    const expiresAt = addDays(new Date(), PLATFORM.BOOST_DURATION_DAYS);

    await prisma.$transaction([
      prisma.boostSubscription.create({
        data: {
          carId,
          operatorId,
          expiresAt,
          paymentRef: paymentRef ?? null,
          pricePaidRwf: PLATFORM.BOOST_PRICE_RWF,
          status: 'ACTIVE',
        },
      }),
      prisma.car.update({
        where: { id: carId },
        data: {
          isFeatured: true,
          featuredUntil: expiresAt,
          boostActivatedAt: new Date(),
          boostPaidUntil: expiresAt,
        },
      }),
    ]);

    return NextResponse.json({ ok: true, expiresAt });
  } catch (err) {
    console.error('[boost] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
