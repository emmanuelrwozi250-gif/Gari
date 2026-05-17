import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VALID_LOCALES = ['en', 'fr'] as const;
type Locale = typeof VALID_LOCALES[number];

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { locale } = await req.json() as { locale: string };

    if (!VALID_LOCALES.includes(locale as Locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    if (session?.user?.id) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { preferredLanguage: locale },
      });
    }

    const res = NextResponse.json({ success: true, locale });
    res.cookies.set('GARI_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      httpOnly: false,
    });
    return res;
  } catch (err) {
    console.error('[PATCH /api/user/locale]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
