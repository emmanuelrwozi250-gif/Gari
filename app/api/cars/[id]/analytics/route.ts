import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST — fire-and-forget from CarCard/car detail on view or click
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { event } = await req.json();

    if (event === 'view') {
      await prisma.car.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    } else if (event === 'click') {
      await prisma.car.update({
        where: { id },
        data: { clickCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Never fail the client — analytics is non-critical
    return NextResponse.json({ ok: true });
  }
}

// GET — for operator dashboard (car must belong to session user)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [car, bookingCount] = await Promise.all([
      prisma.car.findUnique({
        where: { id },
        select: {
          viewCount: true,
          clickCount: true,
          hostId: true,
        },
      }),
      prisma.booking.count({
        where: { carId: id, status: { not: 'CANCELLED' } },
      }),
    ]);

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    // Only the host (operator) may view analytics
    if (car.hostId !== (session.user as { id?: string }).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const conversionRate =
      car.clickCount > 0
        ? Math.round((bookingCount / car.clickCount) * 100)
        : 0;

    return NextResponse.json({
      viewCount: car.viewCount,
      clickCount: car.clickCount,
      bookingCount,
      conversionRate,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
