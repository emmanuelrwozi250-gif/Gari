import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/cars/[id]/cohosts — list co-hosts for a car (owner only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as { id?: string }).id;

  const car = await prisma.car.findUnique({ where: { id }, select: { hostId: true } });
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
  if (car.hostId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const coHosts = await prisma.coHostRelation.findMany({
    where: { carId: id },
    include: {
      coHost: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ coHosts });
}
