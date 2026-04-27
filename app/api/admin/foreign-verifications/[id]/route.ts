import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { action, reason } = body;

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const verification = await prisma.renterVerification.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });

  if (!verification) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (verification.status !== 'PENDING') {
    return NextResponse.json({ error: 'Already reviewed' }, { status: 409 });
  }

  if (action === 'approve') {
    await prisma.$transaction([
      prisma.renterVerification.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
          adminNotes: `Approved by admin ${(session.user as any).email} on ${new Date().toISOString()}`,
        },
      }),
      prisma.user.update({
        where: { id: verification.userId },
        data: {
          foreignVerified: true,
          foreignVerifiedAt: new Date(),
        },
      }),
    ]);
    return NextResponse.json({ success: true, status: 'VERIFIED' });
  }

  // reject
  if (!reason?.trim()) {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
  }

  await prisma.renterVerification.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      adminNotes: `Rejected by admin ${(session.user as any).email} on ${new Date().toISOString()}`,
    },
  });

  return NextResponse.json({ success: true, status: 'REJECTED' });
}
