import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(100),
  message: z.string().min(20).max(1000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = schema.parse(body);

    // Log to console (production: send via Resend / Nodemailer / store in DB)
    console.log('[contact-form]', { name, email, subject, message: message.slice(0, 80) });

    // TODO: send email via Resend when RESEND_API_KEY is configured
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'Gari Contact <noreply@gari.rw>',
    //   to: 'hello@gari.rw',
    //   subject: `[Contact] ${subject} — ${name}`,
    //   text: `From: ${name} <${email}>\n\n${message}`,
    // });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
