/**
 * NotificationService — unified notification orchestrator.
 *
 * Channel priority (per user): WhatsApp → SMS (Africa's Talking) → Email → In-app DB
 * All channels fire in parallel; failure on one never blocks others.
 * Call via: void NotificationService.notify(...) to keep it non-blocking.
 *
 * Usage:
 *   import { NotificationService } from '@/lib/notifications';
 *   void NotificationService.notify('booking.created', hostUser, data);
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsApp } from './whatsapp';
import { sendEmail } from './email';
import { getTemplate, NotificationEvent, BookingTemplateData } from './templates';

interface NotifyUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  preferredLanguage?: string | null;
}

async function saveInApp(
  userId: string,
  title: string,
  message: string,
  type: string
) {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type },
    });
  } catch (err) {
    console.error('[Notification] In-app save failed:', err);
  }
}

async function sendViaSMS(phone: string, message: string) {
  // Africa's Talking SMS fallback
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME || 'sandbox';

  if (!apiKey || apiKey === 'placeholder') {
    console.log(`[SMS DEV] To: ${phone}\n${message}\n${'─'.repeat(40)}`);
    return;
  }

  try {
    const params = new URLSearchParams({
      username,
      to: phone,
      message,
      from: 'GARI',
    });
    await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch (err) {
    console.error('[SMS] Send error:', err);
  }
}

export const NotificationService = {
  /**
   * Send a notification to a single user.
   * @param event  The notification event type
   * @param user   The recipient user record (must include id, email, phone, whatsappNumber, preferredLanguage)
   * @param data   Event-specific template data
   */
  async notify(
    event: NotificationEvent,
    user: NotifyUser,
    data: BookingTemplateData
  ): Promise<void> {
    const lang = user.preferredLanguage || 'en';
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const template = getTemplate(event, lang, { ...data, appUrl });

    // Fire all channels concurrently — never throw
    const tasks: Promise<any>[] = [
      saveInApp(user.id, template.inApp.title, template.inApp.message, event),
    ];

    // WhatsApp (preferred channel)
    const waNumber = user.whatsappNumber || user.phone;
    if (waNumber) {
      tasks.push(
        sendWhatsApp(waNumber, template.whatsapp).catch(err =>
          console.error('[Notification] WhatsApp failed:', err)
        )
      );
    }

    // Email
    if (user.email) {
      tasks.push(
        sendEmail(user.email, template.subject, template.email).catch(err =>
          console.error('[Notification] Email failed:', err)
        )
      );
    }

    // SMS fallback — only if WhatsApp failed or no WhatsApp number
    // (keep it cheap: only fire SMS if WhatsApp number is absent)
    if (!waNumber && user.phone) {
      tasks.push(
        sendViaSMS(user.phone, template.whatsapp).catch(err =>
          console.error('[Notification] SMS failed:', err)
        )
      );
    }

    await Promise.allSettled(tasks);
  },

  /**
   * Notify both parties of a booking event simultaneously.
   * Useful for disputes where both renter and host get the same message.
   */
  async notifyBoth(
    event: NotificationEvent,
    users: NotifyUser[],
    data: BookingTemplateData
  ): Promise<void> {
    await Promise.allSettled(users.map(u => this.notify(event, u, data)));
  },
};

/**
 * Convenience: load user from DB and notify.
 * Avoids callers needing to fetch user fields themselves.
 */
export async function notifyUser(
  event: NotificationEvent,
  userId: string,
  data: BookingTemplateData
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        preferredLanguage: true,
      },
    });
    if (!user) return;
    await NotificationService.notify(event, user, data);
  } catch (err) {
    console.error(`[Notification] notifyUser(${event}, ${userId}) failed:`, err);
  }
}
