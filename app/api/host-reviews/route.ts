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
  reliability: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  respect: z.number().min(1).max(5).optional(),
});

// POST — host reviews a renter after a completed booking
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id;

  try {
    const body = await req.json();
    const { bookingId, rating, comment, reliability, communication, respect } = schema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true, hostReview: true },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.hostId !== userId) {
      return NextResponse.json({ error: 'Only the booking host can submit a host review' }, { status: 403 });
    }
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'You can only review completed bookings' }, { status: 400 });
    }
    if (booking.hostReview) {
      return NextResponse.json({ error: 'You have already reviewed this renter' }, { status: 400 });
    }

    const now = new Date();
    // Reveal immediately if the renter already submitted their review
    const renterAlreadyReviewed = !!booking.review;

    const hostReview = await prisma.hostReview.create({
      data: {
        bookingId,
        renterId: booking.renterId,
        hostId: userId!,
        rating,
        comment,
        reliability,
        communication,
        respect,
        isRevealed: renterAlreadyReviewed,
        revealedAt: renterAlreadyReviewed ? now : undefined,
      },
    });

    // If renter had already reviewed, reveal their review too
    if (renterAlreadyReviewed) {
      await prisma.review.update({
        where: { bookingId },
        data: { isRevealed: true, revealedAt: now },
      });
    }

    // Update renter's reputation score (simple avg of host reviews)
    const renterReviews = await prisma.hostReview.findMany({
      where: { renterId: booking.renterId },
      select: { rating: true },
    });
    const avgRenterRating =
      renterReviews.reduce((s, r) => s + r.rating, 0) / renterReviews.length;

    await prisma.user.update({
      where: { id: booking.renterId },
      data: { renterRating: Math.round(avgRenterRating * 10) / 10 },
    }).catch(() => { /* renterRating field may not exist on all schemas — non-fatal */ });

    return NextResponse.json({
      ...hostReview,
      pendingReveal: !renterAlreadyReviewed,
      message: renterAlreadyReviewed
        ? 'Your review is now live!'
        : 'Review saved. It will be revealed once the renter submits their review (or after 14 days).',
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit host review' }, { status: 500 });
  }
}
