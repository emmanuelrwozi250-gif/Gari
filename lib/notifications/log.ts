/**
 * Stores a notification record in NotificationLog for audit and dedup.
 * Also sends via WhatsApp if a phone number is available.
 */

import { prisma } from '@/lib/prisma';
import { NotifType } from '@prisma/client';
import { sendWhatsApp } from './whatsapp';

export async function logAndSend(params: {
  bookingId?: string;
  userId: string;
  userPhone?: string | null;
  type: NotifType;
  message: string;
}): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        bookingId: params.bookingId ?? null,
        userId: params.userId,
        type: params.type,
        channel: 'WHATSAPP',
        message: params.message,
        delivered: false,
      },
    });
  } catch (err) {
    console.error('[NotifLog] Failed to store log:', err);
  }

  if (params.userPhone) {
    try {
      await sendWhatsApp(params.userPhone, params.message);
    } catch (err) {
      console.error('[NotifLog] WhatsApp send failed:', err);
      // Mark as failed in log (best effort)
      try {
        await prisma.notificationLog.updateMany({
          where: {
            bookingId: params.bookingId ?? undefined,
            userId: params.userId,
            type: params.type,
            delivered: false,
          },
          data: { errorMsg: String(err) },
        });
      } catch {
        // ignore secondary failure
      }
    }
  }
}
