/**
 * POST /api/financing — submit a Drive to Own financing application
 * GET  /api/financing — admin: list all applications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  fullName: z.string().min(2),
  nidaNumber: z.string().min(8),
  monthlyIncome: z.number().int().min(1),
  desiredCarType: z.string().min(1),
  downPayment: z.number().int().min(0),
  timeline: z.enum(['immediate', '1-3months', '3-6months', '6months+']).default('immediate'),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const userId = (session.user as any).id;

    const application = await prisma.financingApplication.create({
      data: { userId, ...data },
    });

    return NextResponse.json({ success: true, applicationId: application.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const applications = await prisma.financingApplication.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });

  return NextResponse.json(applications);
}
