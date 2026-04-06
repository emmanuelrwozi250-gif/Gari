import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const listing = await prisma.salesListing.findUnique({
    where: { id: params.id },
    include: {
      seller: { select: { id: true, name: true, phone: true, whatsappNumber: true, nidaVerified: true, trustScore: true, createdAt: true } },
      enquiries: { select: { id: true, createdAt: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  // Increment view count
  prisma.salesListing.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return NextResponse.json(listing);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const listing = await prisma.salesListing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (listing.sellerId !== userId && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.salesListing.update({
    where: { id: params.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.askingPrice && { askingPrice: body.askingPrice }),
      ...(body.description && { description: body.description }),
      ...(body.featured !== undefined && role === 'ADMIN' && { featured: body.featured }),
      ...(body.inspectionDone !== undefined && role === 'ADMIN' && { inspectionDone: body.inspectionDone }),
    },
  });

  return NextResponse.json(updated);
}
