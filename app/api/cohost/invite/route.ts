import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/cohost/invite
// Body: { carId, coHostEmail, earningsSplitPct?, role? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ownerId = (session.user as { id?: string }).id;
  if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { carId, coHostEmail, earningsSplitPct = 20, role = 'FULL_MANAGEMENT' } = body;

  if (!carId || !coHostEmail) {
    return NextResponse.json({ error: 'carId and coHostEmail are required' }, { status: 400 });
  }

  // Verify caller owns the car
  const car = await prisma.car.findUnique({ where: { id: carId }, select: { hostId: true } });
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
  if (car.hostId !== ownerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Find co-host by email
  const coHost = await prisma.user.findUnique({ where: { email: coHostEmail }, select: { id: true, name: true, email: true } });
  if (!coHost) return NextResponse.json({ error: 'User not found with that email' }, { status: 404 });
  if (coHost.id === ownerId) return NextResponse.json({ error: 'Cannot co-host your own car' }, { status: 400 });

  // Check for existing relation
  const existing = await prisma.coHostRelation.findFirst({
    where: { carId, coHostId: coHost.id },
  });
  if (existing) return NextResponse.json({ error: 'Co-host already invited or active for this car' }, { status: 409 });

  const relation = await prisma.coHostRelation.create({
    data: {
      carId,
      ownerId,
      coHostId: coHost.id,
      earningsSplitPct: Math.min(50, Math.max(5, Number(earningsSplitPct))),
      role: String(role),
      active: false,
    },
  });

  return NextResponse.json({ id: relation.id, coHost: { name: coHost.name, email: coHost.email } }, { status: 201 });
}
