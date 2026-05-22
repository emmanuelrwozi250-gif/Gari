import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, district } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    // Log the signup (replace with DB write or email service when ready)
    console.log('[newsletter] New signup:', { email: email.trim().toLowerCase(), district: district || null, at: new Date().toISOString() });

    // TODO: persist to DB or forward to mailing list service (e.g. Resend, Mailchimp)
    // Example: await prisma.newsletterSignup.create({ data: { email: email.trim().toLowerCase(), district } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
