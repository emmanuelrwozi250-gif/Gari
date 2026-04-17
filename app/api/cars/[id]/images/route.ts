import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** POST /api/cars/[id]/images — add a CarImage record */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const car = await prisma.car.findUnique({ where: { id: params.id }, select: { hostId: true } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    if (car.hostId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { url, alt, order } = await req.json();
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

    const image = await prisma.carImage.create({
      data: { carId: params.id, url, alt: alt || null, order: order ?? 0 },
    });
    return NextResponse.json(image, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add image' }, { status: 500 });
  }
}

/** DELETE /api/cars/[id]/images — remove a CarImage, enforce min 3 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const car = await prisma.car.findUnique({ where: { id: params.id }, select: { hostId: true } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    if (car.hostId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { imageId } = await req.json();
    if (!imageId) return NextResponse.json({ error: 'imageId is required' }, { status: 400 });

    const count = await prisma.carImage.count({ where: { carId: params.id } });
    if (count <= 3) {
      return NextResponse.json({ error: 'Minimum 3 images required' }, { status: 400 });
    }

    await prisma.carImage.delete({ where: { id: imageId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}

/** PATCH /api/cars/[id]/images — reorder images */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const car = await prisma.car.findUnique({ where: { id: params.id }, select: { hostId: true } });
    if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    if (car.hostId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { images }: { images: { id: string; order: number }[] } = await req.json();
    if (!Array.isArray(images)) return NextResponse.json({ error: 'images array required' }, { status: 400 });

    await prisma.$transaction(
      images.map(img => prisma.carImage.update({ where: { id: img.id }, data: { order: img.order } }))
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to reorder images' }, { status: 500 });
  }
}
