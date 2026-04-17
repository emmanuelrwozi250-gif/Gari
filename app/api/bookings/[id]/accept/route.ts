import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CANCELLATION_POLICY } from '@/config/cancellation';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        car: { select: { hostId: true, make: true, model: true, year: true } },
        renter: { select: { name: true, phone: true, whatsappNumber: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Booking is not pending' }, { status: 400 });
    }

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + CANCELLATION_POLICY.HOST_NO_RESPONSE_HOURS);

    await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: 'CONFIRMED',
        hostId: userId,
        hostResponseAt: new Date(),
        hostResponseDeadline: deadline,
      },
    });

    // Build WhatsApp message for host → renter
    const renterWA = (booking.renter.whatsappNumber || booking.renter.phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Hi ${booking.renter.name}, your booking for the ${booking.car.year} ${booking.car.make} ${booking.car.model} has been CONFIRMED ✅. ` +
      `Pickup: ${new Date(booking.pickupDate).toLocaleDateString('en-RW', { weekday: 'short', day: 'numeric', month: 'short' })}. ` +
      `See you soon! — via Gari`
    );
    const waLink = renterWA ? `https://wa.me/${renterWA}?text=${msg}` : null;

    return NextResponse.json({ success: true, waLink });
  } catch (err) {
    console.error('[accept]', err);
    return NextResponse.json({ error: 'Failed to accept booking' }, { status: 500 });
  }
}
