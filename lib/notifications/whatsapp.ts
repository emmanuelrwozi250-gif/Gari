/**
 * WhatsApp adapter using Twilio's WhatsApp Business API (raw fetch — no SDK).
 *
 * Setup:
 *  1. Sign up at twilio.com → get Account SID + Auth Token
 *  2. Enable WhatsApp sandbox (Messaging → Try it out → Send a WhatsApp message)
 *  3. In production: register a WhatsApp Business number and submit message templates
 *  4. Set TWILIO_WHATSAPP_WEBHOOK_URL to https://yourdomain.com/api/webhooks/whatsapp
 *
 * Sandbox number: whatsapp:+14155238886 — users must first send "join <sandbox-code>"
 * Production: your own verified WhatsApp Business number
 */

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

function isConfigured() {
  return (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_ACCOUNT_SID !== 'placeholder' &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_AUTH_TOKEN !== 'placeholder' &&
    process.env.TWILIO_WHATSAPP_FROM &&
    process.env.TWILIO_WHATSAPP_FROM !== 'placeholder'
  );
}

function formatWhatsAppNumber(phone: string): string {
  // Strip everything except digits and leading +
  const digits = phone.replace(/[^\d+]/g, '');
  // Ensure E.164 format with whatsapp: prefix
  const e164 = digits.startsWith('+') ? digits : `+${digits}`;
  return `whatsapp:${e164}`;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export async function sendWhatsApp(
  toPhone: string,
  body: string
): Promise<WhatsAppSendResult> {
  if (!isConfigured()) {
    // Dev mode — log to console instead of sending
    console.log(`[WhatsApp DEV] To: ${toPhone}\n${body}\n${'─'.repeat(40)}`);
    return { success: true, messageSid: `dev-${Date.now()}` };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!; // e.g. whatsapp:+14155238886

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams({
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
    To: formatWhatsAppNumber(toPhone),
    Body: body,
  });

  try {
    const res = await fetch(
      `${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      console.error('[WhatsApp] Send failed:', json);
      return { success: false, error: json.message || 'Twilio API error' };
    }

    return { success: true, messageSid: json.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    console.error('[WhatsApp] Send error:', message);
    return { success: false, error: message };
  }
}

/**
 * Send a Twilio TwiML response (for incoming webhook replies).
 * Returns the XML string to be used as response body.
 */
export function twimlReply(message: string): string {
  // Escape XML special characters
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escaped}</Message>
</Response>`;
}
