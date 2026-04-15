import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Vercel cron calls this with the Authorization header set to CRON_SECRET.
// On the Vercel platform this is enforced automatically; we double-check here.
function isAuthorised(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // local dev — allow through
  return authHeader === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const twentySixHoursAgo = new Date(now.getTime() - 26 * 60 * 60 * 1000);

  // Find completed bookings in the 2–26 hour window that haven't had a review
  // request sent yet and have no review written.
  let processed = 0;
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        reviewRequestSentAt: null,
        review: null,
        updatedAt: {
          gte: twentySixHoursAgo,
          lte: twoHoursAgo,
        },
      },
      include: {
        renter: { select: { name: true, phone: true, whatsappNumber: true } },
        car: { select: { make: true, model: true, year: true } },
      },
      take: 50, // cap per run to avoid timeouts
    });

    for (const booking of bookings) {
      const renterPhone = (booking.renter.whatsappNumber || booking.renter.phone || '').replace(/\D/g, '');
      const reviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://gari-nu.vercel.app'}/reviews/new?booking=${booking.id}`;
      const carName = `${booking.car.year} ${booking.car.make} ${booking.car.model}`;
      const renterName = booking.renter.name?.split(' ')[0] || 'there';

      // Build a WhatsApp deep-link message (opens WhatsApp with pre-filled text)
      const message = encodeURIComponent(
        `Hi ${renterName} 👋 How was your trip in the ${carName}?\n\nYour review helps other renters and rewards great hosts on Gari. It takes just 30 seconds:\n${reviewUrl}\n\nThank you! — The Gari Team 🚗`
      );

      // Fire-and-forget: log the WhatsApp link we would send.
      // In production wire this to your WhatsApp Business API or Twilio.
      console.log(`[review-request] renter=${booking.renterId} phone=+${renterPhone} url=${reviewUrl}`);
      console.log(`[review-request] wa.me/+${renterPhone}?text=${message}`);

      // Mark as sent so we never send twice
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reviewRequestSentAt: now },
      });

      processed++;
    }
  } catch (err) {
    console.error('[review-request cron] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, processed, ranAt: now.toISOString() });
}
