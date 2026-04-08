import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters'),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { bookingId, rating, comment } = schema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.renterId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Only the renter can review' }, { status: 403 });
    }
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'You can only review completed bookings' }, { status: 400 });
    }
    if (booking.review) {
      return NextResponse.json({ error: 'You have already reviewed this booking' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        carId: booking.carId,
        reviewerId: (session.user as any).id,
        rating,
        comment,
      },
    });

    // Update car rating
    const allReviews = await prisma.review.findMany({ where: { carId: booking.carId }, select: { rating: true } });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await prisma.car.update({
      where: { id: booking.carId },
      data: { rating: Math.round(avg * 10) / 10, totalTrips: allReviews.length },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
