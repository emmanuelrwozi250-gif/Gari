/**
 * WhatsApp chatbot webhook — receives incoming messages from Twilio.
 *
 * Configure in Twilio console:
 *   Messaging → Settings → WhatsApp sandbox (or business number)
 *   → "When a message comes in" → POST https://yourdomain.com/api/webhooks/whatsapp
 *
 * Chatbot flow (host receives):
 *   1 → Accept the most recent PENDING booking for their cars
 *   2 → Decline the most recent PENDING booking
 *   3 → Get a deep link to view the booking details
 *
 * Any other message → help text
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { twimlReply } from '@/lib/notifications/whatsapp';
import { notifyUser } from '@/lib/notifications';
import { formatRWF, formatDate } from '@/lib/utils';

// Twilio signs webhooks with X-Twilio-Signature — validate in production.
// For now we check a shared secret to avoid open webhooks.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.TWILIO_WEBHOOK_SECRET;
  if (!secret || secret === 'placeholder') return true; // dev bypass
  const sig = req.headers.get('x-twilio-signature');
  return sig === secret; // production: use twilio.validateRequest()
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Twilio sends form-encoded body
  const formData = await req.formData();
  const from = formData.get('From')?.toString() || '';       // whatsapp:+250788XXXXXX
  const body = formData.get('Body')?.toString().trim() || '';

  // Normalise: strip "whatsapp:" prefix and spaces
  const phone = from.replace(/^whatsapp:/i, '').replace(/\s/g, '');

  // Look up the user by whatsappNumber or phone
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { whatsappNumber: phone },
        { phone },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsappNumber: true,
      preferredLanguage: true,
      role: true,
    },
  });

  if (!user) {
    return xmlResponse(twimlReply(
      `Hi! We don't recognise this number. Please sign up at ${process.env.NEXTAUTH_URL}/register`
    ));
  }

  // ── HOST COMMANDS ────────────────────────────────────────────────────────────
  if (['HOST', 'BOTH', 'ADMIN'].includes(user.role)) {
    // Find the most recent PENDING booking for this host's cars
    const pendingBooking = await prisma.booking.findFirst({
      where: {
        car: { hostId: user.id },
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        car: { select: { make: true, model: true, year: true } },
        renter: {
          select: {
            id: true, name: true, email: true,
            phone: true, whatsappNumber: true, preferredLanguage: true,
          },
        },
      },
    });

    const cmd = body.trim();

    if (cmd === '1') {
      // ── Accept ──────────────────────────────────────────────────────────────
      if (!pendingBooking) {
        return xmlResponse(twimlReply('You have no pending booking requests to accept.'));
      }
      await prisma.booking.update({
        where: { id: pendingBooking.id },
        data: { status: 'CONFIRMED' },
      });

      // Notify the renter
      void notifyUser('booking.confirmed', pendingBooking.renter.id, {
        bookingId: pendingBooking.id,
        hostName: user.name || 'Your host',
        renterName: pendingBooking.renter.name || 'Renter',
        carMake: pendingBooking.car.make,
        carModel: pendingBooking.car.model,
        carYear: pendingBooking.car.year,
        pickupDate: pendingBooking.pickupDate,
        returnDate: pendingBooking.returnDate,
        totalDays: pendingBooking.totalDays,
        totalAmount: pendingBooking.totalAmount,
        pickupLocation: pendingBooking.pickupLocation,
      });

      return xmlResponse(twimlReply(
        `✅ Confirmed!\n\n` +
        `${pendingBooking.car.year} ${pendingBooking.car.make} ${pendingBooking.car.model}\n` +
        `Renter: ${pendingBooking.renter.name}\n` +
        `Pickup: ${formatDate(pendingBooking.pickupDate)}\n` +
        `Ref: ${pendingBooking.id.slice(0, 8).toUpperCase()}\n\n` +
        `The renter has been notified.`
      ));
    }

    if (cmd === '2') {
      // ── Decline ─────────────────────────────────────────────────────────────
      if (!pendingBooking) {
        return xmlResponse(twimlReply('You have no pending booking requests to decline.'));
      }
      await prisma.booking.update({
        where: { id: pendingBooking.id },
        data: { status: 'CANCELLED', cancellationReason: 'Declined by host' },
      });

      void notifyUser('booking.declined', pendingBooking.renter.id, {
        bookingId: pendingBooking.id,
        hostName: user.name || 'Your host',
        carMake: pendingBooking.car.make,
        carModel: pendingBooking.car.model,
        carYear: pendingBooking.car.year,
        pickupDate: pendingBooking.pickupDate,
        returnDate: pendingBooking.returnDate,
        totalAmount: pendingBooking.totalAmount,
        pickupLocation: pendingBooking.pickupLocation,
      });

      return xmlResponse(twimlReply(
        `❌ Booking declined.\n\n` +
        `${pendingBooking.car.year} ${pendingBooking.car.make} ${pendingBooking.car.model}\n` +
        `Renter: ${pendingBooking.renter.name}\n` +
        `Ref: ${pendingBooking.id.slice(0, 8).toUpperCase()}\n\n` +
        `The renter has been notified.`
      ));
    }

    if (cmd === '3') {
      // ── View details ────────────────────────────────────────────────────────
      if (!pendingBooking) {
        const appUrl = process.env.NEXTAUTH_URL || 'https://gari.rw';
        return xmlResponse(twimlReply(
          `No pending requests. View all your bookings:\n${appUrl}/dashboard/host`
        ));
      }
      const appUrl = process.env.NEXTAUTH_URL || 'https://gari.rw';
      return xmlResponse(twimlReply(
        `📋 *Booking Details*\n\n` +
        `Car: ${pendingBooking.car.year} ${pendingBooking.car.make} ${pendingBooking.car.model}\n` +
        `Renter: ${pendingBooking.renter.name}\n` +
        `Pickup: ${formatDate(pendingBooking.pickupDate)}\n` +
        `Return: ${formatDate(pendingBooking.returnDate)}\n` +
        `Days: ${pendingBooking.totalDays}\n` +
        `Amount: ${formatRWF(pendingBooking.totalAmount)}\n` +
        `Ref: ${pendingBooking.id.slice(0, 8).toUpperCase()}\n\n` +
        `View: ${appUrl}/dashboard/host\n\n` +
        `Reply 1 to Accept, 2 to Decline`
      ));
    }
  }

  // ── DEFAULT HELP ─────────────────────────────────────────────────────────────
  const appUrl = process.env.NEXTAUTH_URL || 'https://gari.rw';
  const isHost = ['HOST', 'BOTH', 'ADMIN'].includes(user.role);
  const help = isHost
    ? `Hi ${user.name?.split(' ')[0] || 'there'}! 👋\n\nFor pending booking requests, reply:\n*1* — Accept\n*2* — Decline\n*3* — View details\n\nOr visit: ${appUrl}/dashboard/host`
    : `Hi ${user.name?.split(' ')[0] || 'there'}! 👋\n\nFor help with your Gari booking, visit:\n${appUrl}/dashboard\n\nOr contact support: support@gari.rw`;

  return xmlResponse(twimlReply(help));
}

function xmlResponse(xml: string) {
  return new NextResponse(xml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
