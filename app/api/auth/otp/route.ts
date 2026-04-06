import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple in-memory OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expires: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('250')) return `+${digits}`;
  if (digits.startsWith('0')) return `+250${digits.slice(1)}`;
  return `+250${digits}`;
}

// POST /api/auth/otp — send OTP to phone number
export async function POST(req: NextRequest) {
  const { phone, purpose = 'verify' } = await req.json();
  if (!phone) return NextResponse.json({ error: 'Phone number required' }, { status: 400 });

  const formatted = formatPhone(phone);
  const otp = generateOTP();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(formatted, { otp, expires });

  // Africa's Talking SMS API
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const username = process.env.AFRICAS_TALKING_USERNAME || 'sandbox';

  if (apiKey && apiKey !== 'placeholder') {
    try {
      const params = new URLSearchParams({
        username,
        to: formatted,
        message: `Your Gari verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
        from: 'GARI',
      });

      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        console.error('Africa\'s Talking error:', await response.text());
      }
    } catch (err) {
      console.error('SMS send error:', err);
      // Don't fail — still return success in development
    }
  } else {
    // Development: log OTP instead of sending
    console.log(`[DEV] OTP for ${formatted}: ${otp}`);
  }

  return NextResponse.json({ success: true, message: 'OTP sent' });
}

// PUT /api/auth/otp — verify OTP
export async function PUT(req: NextRequest) {
  const { phone, otp } = await req.json();
  if (!phone || !otp) {
    return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 });
  }

  const formatted = formatPhone(phone);
  const stored = otpStore.get(formatted);

  if (!stored) {
    return NextResponse.json({ error: 'No OTP sent to this number' }, { status: 400 });
  }

  if (Date.now() > stored.expires) {
    otpStore.delete(formatted);
    return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
  }

  if (stored.otp !== otp) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  }

  otpStore.delete(formatted);

  // Update user's phone as verified if they're logged in
  // (handled in profile update flow)
  return NextResponse.json({ success: true, verified: true });
}
