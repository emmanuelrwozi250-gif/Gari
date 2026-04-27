import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  nidaNumber: z.string().optional(),
  role: z.enum(['RENTER', 'HOST', 'BOTH']).default('RENTER'),
  // Foreign renter fields
  renterType: z.enum(['LOCAL', 'FOREIGN']).default('LOCAL'),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  passportImageUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // Validate foreign renter required fields
    if (data.renterType === 'FOREIGN') {
      if (!data.nationality) {
        return NextResponse.json({ error: 'Nationality is required for international renters' }, { status: 400 });
      }
    }

    const hashedPassword = await hash(data.password, 12);

    // Normalize phone for locals (Rwanda +250), keep as-is for foreigners
    const normalizedPhone = (() => {
      if (!data.phone) return null;
      if (data.renterType === 'FOREIGN') {
        // Foreign renters supply full international number
        return data.phone.startsWith('+') ? data.phone : `+${data.phone}`;
      }
      // Local Rwanda normalization
      return `+250${data.phone.replace(/\D/g, '').replace(/^0/, '').replace(/^250/, '')}`;
    })();

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: normalizedPhone,
        nidaNumber: data.nidaNumber || null,
        role: data.role,
        renterType: data.renterType,
        nationality: data.nationality || null,
        foreignVerified: false,
      },
      select: { id: true, name: true, email: true, role: true, renterType: true },
    });

    // Create passport verification record for foreign renters
    if (data.renterType === 'FOREIGN' && (data.passportNumber || data.passportImageUrl)) {
      await prisma.renterVerification.create({
        data: {
          userId: user.id,
          idType: 'PASSPORT',
          idNumber: data.passportNumber || null,
          idPhotoFrontUrl: data.passportImageUrl || null,
          fullNameOnId: data.name,
          status: 'PENDING',
          adminNotes: `Passport submitted at registration. Nationality: ${data.nationality}. Expiry: ${data.passportExpiry || 'not provided'}.`,
        },
      });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error('[register]', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
