import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/admin/cars/[id]/compliance
 * Body: { action: 'approve' | 'reject', reason?: string }
 *
 * Sets complianceStatus + isVerified atomically.
 * Auth: ADMIN role only.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string; role?: string } | undefined;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { action, reason } = await req.json() as {
      action: 'approve' | 'reject';
      reason?: string;
    };

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const isApprove = action === 'approve';

    const car = await prisma.car.update({
      where: { id },
      data: {
        isVerified: isApprove,
        complianceStatus: isApprove ? 'APPROVED' : 'REJECTED',
        // Ensure APPROVED cars are commercial; reset rejected to pending next cycle
        vehicleType: 'COMMERCIAL',
      },
      select: { id: true, make: true, model: true, complianceStatus: true },
    });

    console.log(
      `[compliance] ${action.toUpperCase()} car ${car.id} (${car.make} ${car.model})` +
      (reason ? ` — reason: ${reason}` : '')
    );

    return NextResponse.json({ ok: true, car });
  } catch (err) {
    console.error('[compliance] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
