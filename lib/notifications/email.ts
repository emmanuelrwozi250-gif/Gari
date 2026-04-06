/**
 * Email adapter using Resend (already in package.json).
 * Falls back silently if RESEND_API_KEY is not configured.
 */

interface EmailSendResult {
  success: boolean;
  id?: string;
  error?: string;
}

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Gari <no-reply@gari.rw>';

function isConfigured() {
  return (
    process.env.RESEND_API_KEY &&
    process.env.RESEND_API_KEY !== 're_placeholder' &&
    process.env.RESEND_API_KEY !== 'placeholder'
  );
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<EmailSendResult> {
  if (!isConfigured()) {
    console.log(`[Email DEV] To: ${to} | Subject: ${subject}`);
    return { success: true, id: `dev-${Date.now()}` };
  }

  try {
    // Dynamic import so it doesn't crash if resend is missing from node_modules
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html: wrapEmailHtml(subject, htmlBody),
    });

    if (error) {
      console.error('[Email] Send failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email error';
    console.error('[Email] Error:', message);
    return { success: false, error: message };
  }
}

function wrapEmailHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f1923;padding:20px 32px;">
            <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
              Gar<span style="color:#f5c518;">i</span><span style="color:#1a7a4a;font-size:14px;">•</span>
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;color:#1a2332;font-size:15px;line-height:1.6;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f4f6f8;padding:16px 32px;font-size:12px;color:#8a9ab8;border-top:1px solid #e2e8ef;">
            Gari — Rwanda's Car Rental Marketplace<br/>
            <a href="${process.env.NEXTAUTH_URL || 'https://gari.rw'}" style="color:#1a7a4a;">gari.rw</a>
            · Questions? <a href="mailto:support@gari.rw" style="color:#1a7a4a;">support@gari.rw</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
