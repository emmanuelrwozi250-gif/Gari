import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — fetch current user's verification status
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const verification = await prisma.renterVerification.findUnique({ where: { userId } });
  return NextResponse.json(verification ?? { status: 'UNVERIFIED' });
}

// POST — create or update verification record
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json() as {
    idType?: string;
    idPhotoFrontUrl?: string;
    idPhotoBackUrl?: string;
    drivingPermitUrl?: string;
    selfieUrl?: string;
    fullNameOnId?: string;
    idNumber?: string;
  };

  const verification = await prisma.renterVerification.upsert({
    where: { userId },
    create: { userId, ...body, status: 'PENDING' },
    update: { ...body, status: 'PENDING', rejectionReason: null },
  });

  return NextResponse.json(verification);
}
