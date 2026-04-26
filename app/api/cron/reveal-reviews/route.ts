import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Runs daily — reveals reviews that have passed the 14-day blind window
// even if only one party submitted.
export async function GET() {
  const deadline = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const now = new Date();

  try {
    // Reveal renter→car reviews older than 14 days that are still hidden
    const [revealedReviews, revealedHostReviews] = await Promise.all([
      prisma.review.updateMany({
        where: { isRevealed: false, createdAt: { lt: deadline } },
        data: { isRevealed: true, revealedAt: now },
      }),
      prisma.hostReview.updateMany({
        where: { isRevealed: false, createdAt: { lt: deadline } },
        data: { isRevealed: true, revealedAt: now },
      }),
    ]);

    console.log(`[reveal-reviews] revealed ${revealedReviews.count} renter reviews, ${revealedHostReviews.count} host reviews`);

    return NextResponse.json({
      ok: true,
      revealedRenterReviews: revealedReviews.count,
      revealedHostReviews: revealedHostReviews.count,
    });
  } catch (err) {
    console.error('[reveal-reviews]', err);
    return NextResponse.json({ error: 'Failed to reveal reviews' }, { status: 500 });
  }
}
