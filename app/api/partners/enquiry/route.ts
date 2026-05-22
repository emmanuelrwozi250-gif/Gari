import { NextRequest, NextResponse } from 'next/server';
import { waLink } from '@/lib/config/company';

export async function POST(request: NextRequest) {
  try {
    // Support both JSON (fetch) and form submissions (plain HTML form)
    const contentType = request.headers.get('content-type') || '';
    let name = '', organisation = '', type = '', email = '', phone = '', website = '', monthlyVolume = '', message = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      ({ name = '', organisation = '', type = '', email = '', phone = '', website = '', monthlyVolume = '', message = '' } = body);
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name         = String(formData.get('name')          || '');
      organisation = String(formData.get('organisation')  || '');
      type         = String(formData.get('type')          || '');
      email        = String(formData.get('email')         || '');
      phone        = String(formData.get('phone')         || '');
      website      = String(formData.get('website')       || '');
      monthlyVolume = String(formData.get('monthlyVolume') || '');
      message      = String(formData.get('message')       || '');
    } else {
      return NextResponse.json({ error: 'Unsupported content type.' }, { status: 415 });
    }

    if (!name || !organisation || !email) {
      return NextResponse.json({ error: 'name, organisation, and email are required.' }, { status: 400 });
    }

    // Log the enquiry (replace with DB write or notification service when ready)
    console.log('[partners/enquiry] New application:', {
      name, organisation, type, email, phone, website, monthlyVolume, message,
      at: new Date().toISOString(),
    });

    // TODO: send WhatsApp notification to admin
    const _notifyLink = waLink(
      `New partner application from ${name} at ${organisation} (${type}). Email: ${email}. Volume: ${monthlyVolume}.`
    );
    // e.g. await fetch(_notifyLink) — or use Twilio/Meta Cloud API for automated send

    // For HTML form submissions, redirect to a thank-you page or back with a success param
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (acceptsHtml) {
      return NextResponse.redirect(new URL('/partners?applied=1', request.url), 303);
    }

    return NextResponse.json({ ok: true });
  } catch {
    console.error('[partners/enquiry] Error processing request');
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
