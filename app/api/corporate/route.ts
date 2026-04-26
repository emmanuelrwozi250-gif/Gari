import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  orgName: z.string().min(2),
  orgType: z.enum(['CORPORATE', 'NGO', 'GOVERNMENT', 'SME']).default('CORPORATE'),
  taxId: z.string().optional(),
  billingAddress: z.string().optional(),
  billingEmail: z.string().email(),
  contactName: z.string().min(2),
  contactPhone: z.string().optional(),
});

// POST /api/corporate — create a new corporate account application
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Check if user already has a corporate account
    const existing = await prisma.corporateAccount.findFirst({
      where: { adminUserId: userId },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a corporate account', accountId: existing.id },
        { status: 409 }
      );
    }

    const account = await prisma.corporateAccount.create({
      data: {
        ...data,
        adminUserId: userId,
        status: 'PENDING',
      },
    });

    // Auto-add admin as first member
    await prisma.corporateMember.create({
      data: {
        corporateAccountId: account.id,
        userId,
        role: 'ADMIN',
      },
    });

    // Link user to account
    await prisma.user.update({
      where: { id: userId },
      data: { corporateAccountId: account.id },
    });

    return NextResponse.json({ ok: true, accountId: account.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error('[corporate/POST]', err);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

// GET /api/corporate — get current user's corporate account
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;

  const account = await prisma.corporateAccount.findFirst({
    where: { OR: [{ adminUserId: userId }, { members: { some: { userId } } }] },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      _count: { select: { bookings: true } },
    },
  });

  if (!account) return NextResponse.json({ error: 'No corporate account found' }, { status: 404 });

  return NextResponse.json(account);
}
