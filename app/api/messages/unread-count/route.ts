import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ count: 0 });

  const userId = (session.user as { id?: string }).id!;

  try {
    const count = await prisma.message.count({
      where: {
        senderId: { not: userId },
        read: false,
        booking: {
          OR: [{ renterId: userId }, { car: { hostId: userId } }],
        },
      },
    });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
