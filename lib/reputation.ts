/**
 * Reputation system — tracks late returns and escalates to suspension.
 * Call recordLateReturn() whenever a booking is confirmed as returned late
 * (i.e. after lateFeeAccrued > 0 is confirmed on the booking).
 */

import { RENTAL_POLICY } from '@/config/rental-policy';
import { addDays, subMonths } from 'date-fns';
import { prisma } from '@/lib/prisma';

export interface ReputationResult {
  lateReturnCount: number;
  flagged: boolean;
  suspended: boolean;
  suspendedUntil?: Date;
}

export async function recordLateReturn(
  renterId: string
): Promise<ReputationResult> {
  const user = await prisma.user.findUnique({
    where: { id: renterId },
    select: {
      id: true,
      lateReturnCount: true,
      lateReturnFlaggedAt: true,
      suspendedUntil: true,
    },
  });
  if (!user) throw new Error('User not found');

  // Count late returns in the past 6 months
  const sixMonthsAgo = subMonths(new Date(), 6);
  const recentLateCount = await prisma.booking.count({
    where: {
      renterId,
      lateFeeAccrued: { gt: 0 },
      returnDate: { gte: sixMonthsAgo },
    },
  });

  const newCount = recentLateCount + 1;
  const updates: Record<string, unknown> = { lateReturnCount: newCount };

  let flagged = !!user.lateReturnFlaggedAt;
  let suspended = false;
  let suspendedUntil: Date | undefined;

  // Flag as "Late returner" — shown to hosts on booking requests
  if (newCount >= RENTAL_POLICY.LATE_FLAG_COUNT && !user.lateReturnFlaggedAt) {
    updates.lateReturnFlaggedAt = new Date();
    flagged = true;
  }

  // Suspend from making new bookings
  if (newCount >= RENTAL_POLICY.SUSPENSION_COUNT) {
    suspendedUntil = addDays(new Date(), RENTAL_POLICY.SUSPENSION_DAYS);
    updates.suspendedUntil = suspendedUntil;
    updates.suspensionReason = `${newCount} late returns in the past 6 months`;
    suspended = true;
  }

  await prisma.user.update({ where: { id: renterId }, data: updates });

  return { lateReturnCount: newCount, flagged, suspended, suspendedUntil };
}

/**
 * Check if a renter is currently suspended.
 * Call this in POST /api/bookings before creating a booking.
 */
export async function checkSuspension(renterId: string): Promise<{
  suspended: boolean;
  reason?: string;
  until?: Date;
}> {
  const user = await prisma.user.findUnique({
    where: { id: renterId },
    select: { suspendedUntil: true, suspensionReason: true },
  });

  if (!user) return { suspended: false };
  if (!user.suspendedUntil) return { suspended: false };
  if (user.suspendedUntil <= new Date()) return { suspended: false };

  return {
    suspended: true,
    reason: user.suspensionReason ?? 'Account suspended due to repeated late returns',
    until: user.suspendedUntil,
  };
}
