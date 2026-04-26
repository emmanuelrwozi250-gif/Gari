import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DepositStatus } from '@prisma/client';
import { recordLateReturn } from '@/lib/reputation';
import { generateEBMReceipt } from '@/lib/ebm';

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
        car: {
          select: {
            hostId: true, make: true, model: true, year: true, pricePerDay: true,
            host: { select: { name: true } },
          },
        },
        renter: { select: { name: true, phone: true, whatsappNumber: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (booking.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Booking must be ACTIVE to mark as returned' }, { status: 400 });
    }

    const now = new Date();

    // Generate EBM receipt number
    const receipt = generateEBMReceipt({
      id: booking.id,
      subtotal: booking.subtotal,
      driverFee: booking.driverFee,
      platformFee: booking.platformFee,
      insuranceFee: booking.insuranceFee,
      vatAmount: booking.vatAmount,
      totalAmount: booking.totalAmount,
      totalDays: booking.totalDays,
      withDriver: booking.withDriver,
      car: {
        make: booking.car.make,
        model: booking.car.model,
        year: booking.car.year,
        pricePerDay: booking.car.pricePerDay,
      },
      renter: {
        name: booking.renter.name,
        phone: booking.renter.whatsappNumber ?? booking.renter.phone,
      },
      host: { name: booking.car.host?.name ?? null },
    });

    const updateData = {
      status: 'COMPLETED' as const,
      carReturnedSafelyAt: now,
      carReturnedSafelyBy: userId,
      completedAt: now,
      vatReceiptRef: receipt.receiptNo,
      depositStatus: booking.depositAmount > 0 ? DepositStatus.REFUNDED : DepositStatus.NOT_APPLICABLE,
      depositRefundedAt: booking.depositAmount > 0 ? now : undefined,
      depositRefundAmount: booking.depositAmount > 0 ? booking.depositAmount : undefined,
    };

    if (booking.depositAmount > 0) {
      await prisma.$transaction([
        prisma.booking.update({ where: { id: params.id }, data: updateData }),
        prisma.refund.create({
          data: {
            bookingId: params.id,
            amount: booking.depositAmount,
            reason: 'Security deposit — car returned safely',
            initiatedBy: userId,
            status: 'PENDING',
          },
        }),
      ]);
    } else {
      await prisma.booking.update({ where: { id: params.id }, data: updateData });
    }

    // Record late return against renter reputation (non-blocking)
    if ((booking as any).lateFeeAccrued > 0) {
      void recordLateReturn(booking.renterId).catch(e =>
        console.error('[return-safe] recordLateReturn failed:', e)
      );
    }

    // WhatsApp link to thank the renter
    const renterWA = (booking.renter.whatsappNumber || booking.renter.phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Hi ${booking.renter.name}, thanks for returning the ${booking.car.year} ${booking.car.make} ${booking.car.model} safely ✅. ` +
      (booking.depositAmount > 0
        ? `Your deposit of RWF ${booking.depositAmount.toLocaleString()} will be refunded within 48 hours. `
        : '') +
      `Your EBM receipt: ${receipt.receiptNo}. Please leave a review on Gari 🌟`
    );
    const waLink = renterWA ? `https://wa.me/${renterWA}?text=${msg}` : null;

    return NextResponse.json({ success: true, waLink, receiptNo: receipt.receiptNo });
  } catch (err) {
    console.error('[return-safe]', err);
    return NextResponse.json({ error: 'Failed to mark trip as returned' }, { status: 500 });
  }
}
