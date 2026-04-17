import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RENTAL_POLICY, calculateLateFee } from '@/config/rental-policy';
import { logAndSend } from '@/lib/notifications/log';
import {
  msg_reminder2h,
  msg_reminder30m,
  msg_atReturnTime,
  msg_late30m,
  msg_late1h,
  msg_escalation,
  msg_host_lateWarning,
  msg_host_noShowUnlock,
} from '@/lib/notifications/late-return-messages';
import { NotifType } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Cron: booking-notifications
 * Runs multiple times per day (Vercel Hobby: daily only, scheduled at 08, 12, 16, 20 CAT).
 * In production on a paid plan, increase to hourly or every 5 minutes.
 *
 * Checks all CONFIRMED/ACTIVE bookings near their returnDate:
 *   - 2h before → reminder
 *   - 30m before → reminder
 *   - At return time → grace-period notice
 *   - 30m late → late fee warning (renter + host)
 *   - 1h late → urgent + host no-show unlock
 *   - 24h late → escalation + set DISPUTED
 *
 * Dedup: each sentAt field is set once and checked before firing.
 * Safe to run multiple times — will never double-send.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (
    auth !== `Bearer ${process.env.CRON_SECRET}` &&
    process.env.NODE_ENV !== 'development'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results = {
    processed: 0,
    notifications: 0,
    errors: [] as string[],
  };

  // Find bookings ending in the past 25h or next 3h that may need notifications
  let bookings: any[] = [];
  try {
    bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        returnDate: {
          gte: new Date(now.getTime() - 25 * 60 * 60 * 1000),
          lte: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        },
      },
      include: {
        renter: { select: { id: true, name: true, phone: true, whatsappNumber: true } },
        car: {
          include: {
            host: { select: { id: true, name: true, phone: true, whatsappNumber: true } },
          },
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: `DB query failed: ${err.message}` }, { status: 500 });
  }

  for (const booking of bookings) {
    try {
      results.processed++;

      const carName = `${booking.car.make} ${booking.car.model}`;
      const renter = booking.renter;
      const host = booking.car.host;
      const renterPhone = renter.whatsappNumber || renter.phone;
      const hostPhone = host.whatsappNumber || host.phone;

      const minutesToEnd =
        (booking.returnDate.getTime() - now.getTime()) / 60000;
      const minutesLate = -minutesToEnd; // positive when past returnDate

      // ── 2 HOURS BEFORE ───────────────────────────────────────────────────────
      if (
        minutesToEnd <= RENTAL_POLICY.NOTIF_2H_MINUTES &&
        minutesToEnd > RENTAL_POLICY.NOTIF_30M_MINUTES &&
        !booking.notif2hSentAt
      ) {
        await logAndSend({
          bookingId: booking.id,
          userId: renter.id,
          userPhone: renterPhone,
          type: NotifType.REMINDER_2H,
          message: msg_reminder2h(renter.name, carName, booking.returnDate, booking.id),
        });
        await prisma.booking.update({
          where: { id: booking.id },
          data: { notif2hSentAt: now },
        });
        results.notifications++;
      }

      // ── 30 MINUTES BEFORE ────────────────────────────────────────────────────
      if (
        minutesToEnd <= RENTAL_POLICY.NOTIF_30M_MINUTES &&
        minutesToEnd > -5 &&
        !booking.notif30mSentAt
      ) {
        await logAndSend({
          bookingId: booking.id,
          userId: renter.id,
          userPhone: renterPhone,
          type: NotifType.REMINDER_30M,
          message: msg_reminder30m(renter.name, carName, booking.returnDate, booking.id),
        });
        await prisma.booking.update({
          where: { id: booking.id },
          data: { notif30mSentAt: now },
        });
        results.notifications++;
      }

      // ── AT RETURN TIME (±5 min) ────────────────────────────────────────────
      if (
        minutesToEnd <= 5 &&
        minutesToEnd >= -5 &&
        !booking.notifAtReturnSentAt
      ) {
        await logAndSend({
          bookingId: booking.id,
          userId: renter.id,
          userPhone: renterPhone,
          type: NotifType.REMINDER_AT_TIME,
          message: msg_atReturnTime(renter.name, carName, booking.returnDate, booking.id),
        });
        await prisma.booking.update({
          where: { id: booking.id },
          data: { notifAtReturnSentAt: now },
        });
        results.notifications++;
      }

      // ── PAST GRACE PERIOD — accrue late fees ─────────────────────────────────
      if (minutesLate > RENTAL_POLICY.GRACE_PERIOD_MINUTES) {
        const lateFee = calculateLateFee(minutesLate, booking.car.pricePerDay);

        await prisma.booking.update({
          where: { id: booking.id },
          data: { lateFeeAccrued: lateFee },
        });

        // ── 30 MINUTES LATE ──────────────────────────────────────────────────
        if (
          minutesLate >= RENTAL_POLICY.NOTIF_LATE_30M_MINUTES &&
          minutesLate < RENTAL_POLICY.NOTIF_LATE_1H_MINUTES &&
          !booking.notif30mLateSentAt
        ) {
          await Promise.all([
            logAndSend({
              bookingId: booking.id,
              userId: renter.id,
              userPhone: renterPhone,
              type: NotifType.LATE_30M,
              message: msg_late30m(
                renter.name, carName, Math.round(minutesLate), lateFee, booking.id
              ),
            }),
            logAndSend({
              bookingId: booking.id,
              userId: host.id,
              userPhone: hostPhone,
              type: NotifType.HOST_LATE_WARNING,
              message: msg_host_lateWarning(
                host.name, renter.name, carName, Math.round(minutesLate), booking.id
              ),
            }),
          ]);
          await prisma.booking.update({
            where: { id: booking.id },
            data: { notif30mLateSentAt: now, hostNotifLateSentAt: now },
          });
          results.notifications += 2;
        }

        // ── 1 HOUR LATE ──────────────────────────────────────────────────────
        if (
          minutesLate >= RENTAL_POLICY.NOTIF_LATE_1H_MINUTES &&
          minutesLate < RENTAL_POLICY.NOTIF_LATE_1H_MINUTES + 30 &&
          !booking.notif1hLateSentAt
        ) {
          await Promise.all([
            logAndSend({
              bookingId: booking.id,
              userId: renter.id,
              userPhone: renterPhone,
              type: NotifType.LATE_1H,
              message: msg_late1h(
                renter.name, carName, Math.round(minutesLate), lateFee, booking.id
              ),
            }),
            logAndSend({
              bookingId: booking.id,
              userId: host.id,
              userPhone: hostPhone,
              type: NotifType.HOST_NO_SHOW_UNLOCK,
              message: msg_host_noShowUnlock(host.name, renter.name, carName, booking.id),
            }),
          ]);
          await prisma.booking.update({
            where: { id: booking.id },
            data: { notif1hLateSentAt: now },
          });
          results.notifications += 2;
        }

        // ── 24 HOURS LATE — ESCALATION ────────────────────────────────────────
        if (
          minutesLate >= RENTAL_POLICY.LATE_ESCALATION_HOURS * 60 &&
          !booking.lateReturnReportedAt
        ) {
          await logAndSend({
            bookingId: booking.id,
            userId: renter.id,
            userPhone: renterPhone,
            type: NotifType.LATE_ESCALATION,
            message: msg_escalation(
              renter.name, carName, host.name, Math.round(minutesLate / 60)
            ),
          });
          await prisma.booking.update({
            where: { id: booking.id },
            data: { lateReturnReportedAt: now, status: 'DISPUTED' },
          });
          results.notifications++;
        }
      }
    } catch (err: any) {
      console.error(`[booking-notifications] Booking ${booking.id}:`, err);
      results.errors.push(`${booking.id}: ${err.message}`);
    }
  }

  return NextResponse.json(results);
}
