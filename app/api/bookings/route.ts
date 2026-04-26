import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notifyUser } from '@/lib/notifications';
import { checkSuspension } from '@/lib/reputation';
import { calculateVAT } from '@/config/vat';
import { getDynamicMultiplier, applyMultiplier } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const bookingSchema = z.object({
  carId: z.string().min(1),
  pickupDate: z.string(),
  returnDate: z.string(),
  withDriver: z.boolean().default(false),
  pickupLocation: z.string().min(1),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  totalDays: z.number().min(1),
  subtotal: z.number().min(0),
  platformFee: z.number().min(0),
  driverFee: z.number().default(0),
  insuranceFee: z.number().default(0),
  totalAmount: z.number().min(0),
  paymentMethod: z.enum(['MTN_MOMO', 'AIRTEL_MONEY', 'CARD']),
  referralCode: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const where: any = {};
    if (role === 'ADMIN') {
      if (status) where.status = status;
    } else {
      where.renterId = userId;
      if (status) where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        car: { include: { host: { select: { name: true, avatar: true } } } },
        renter: { select: { name: true, avatar: true, email: true } },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = bookingSchema.parse(body);

    // Check if renter is suspended
    const suspension = await checkSuspension((session.user as any).id);
    if (suspension.suspended) {
      return NextResponse.json(
        {
          error: `Your account is suspended until ${suspension.until?.toLocaleDateString('en-RW', { day: 'numeric', month: 'long', year: 'numeric' })}. Reason: ${suspension.reason}`,
        },
        { status: 403 }
      );
    }

    // Verify car is available and fetch pricing mode
    const car = await prisma.car.findUnique({
      where: { id: data.carId },
      select: {
        isAvailable: true,
        pricePerDay: true,
        driverPricePerDay: true,
        pricingMode: true,
        district: true,
        make: true,
        model: true,
        year: true,
        hostId: true,
      },
    });
    if (!car?.isAvailable) {
      return NextResponse.json({ error: 'This car is not available' }, { status: 400 });
    }

    // Double-booking prevention
    const pickupDt = new Date(data.pickupDate);
    const returnDt = new Date(data.returnDate);

    const [overlappingBookings, blockedDates] = await Promise.all([
      prisma.booking.count({
        where: {
          carId: data.carId,
          status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
          AND: [
            { pickupDate: { lt: returnDt } },
            { returnDate: { gt: pickupDt } },
          ],
        },
      }),
      prisma.carAvailability.count({
        where: {
          carId: data.carId,
          AND: [
            { startDate: { lt: returnDt } },
            { endDate: { gt: pickupDt } },
          ],
        },
      }),
    ]);

    if (overlappingBookings > 0) {
      return NextResponse.json(
        { error: 'Car is already booked for the selected dates. Please choose different dates.' },
        { status: 409 }
      );
    }
    if (blockedDates > 0) {
      return NextResponse.json(
        { error: 'Car is unavailable for the selected dates (blocked by host).' },
        { status: 409 }
      );
    }

    // ── Dynamic pricing (server-authoritative) ──────────────────────────────
    let dynamicMultiplier = 1.0;
    let adjustedSubtotal = data.subtotal;

    if (car.pricingMode === 'dynamic') {
      const pricing = await getDynamicMultiplier(
        data.pickupDate,
        data.returnDate,
        car.district,
        prisma
      );
      dynamicMultiplier = pricing.multiplier;
      // Recompute subtotal from server-side base price to prevent tampering
      const serverBaseSubtotal = car.pricePerDay * data.totalDays;
      adjustedSubtotal = applyMultiplier(serverBaseSubtotal, dynamicMultiplier);
    }

    // ── VAT (18%) — server-authoritative ───────────────────────────────────
    const vatAmount = calculateVAT(adjustedSubtotal, data.driverFee);

    // Platform fee based on adjusted subtotal
    const serverPlatformFee = Math.round(adjustedSubtotal * 0.10);

    // Final total: rental + platform fee + driver + insurance + VAT
    const serverTotalAmount = adjustedSubtotal + serverPlatformFee + data.driverFee + data.insuranceFee + vatAmount;

    // ── Referral commission ────────────────────────────────────────────────
    let referralCommission = 0;
    let validReferralCode: string | undefined;
    if (data.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: data.referralCode },
        select: { id: true },
      });
      if (referrer && referrer.id !== (session.user as any).id) {
        validReferralCode = data.referralCode;
        referralCommission = Math.round(serverPlatformFee * 0.05);
      }
    }

    const booking = await prisma.booking.create({
      data: {
        carId: data.carId,
        renterId: (session.user as any).id,
        pickupDate: pickupDt,
        returnDate: returnDt,
        withDriver: data.withDriver,
        pickupLocation: data.pickupLocation,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        totalDays: data.totalDays,
        subtotal: adjustedSubtotal,
        platformFee: serverPlatformFee,
        driverFee: data.driverFee,
        insuranceFee: data.insuranceFee,
        vatAmount,
        dynamicMultiplier,
        totalAmount: serverTotalAmount,
        paymentMethod: data.paymentMethod,
        referralCode: validReferralCode,
        referralCommission,
        notes: data.notes,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      },
    });

    // Notify host
    void notifyUser('booking.created', car.hostId, {
      bookingId: booking.id,
      renterName: (session.user as any).name || 'A renter',
      carMake: car.make,
      carModel: car.model,
      carYear: car.year,
      pickupDate: booking.pickupDate,
      returnDate: booking.returnDate,
      totalDays: booking.totalDays,
      totalAmount: booking.totalAmount,
      pickupLocation: booking.pickupLocation,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
