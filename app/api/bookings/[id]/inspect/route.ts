/**
 * POST /api/bookings/:id/inspect
 * Runs AI-powered visual inspection on car photos using Anthropic Claude Vision.
 * Called at pickup and return handover.
 *
 * Body: { photoUrls: string[], stage: 'pickup' | 'return' }
 * Returns: { condition, damages, recommendation, confidence, rawAnalysis }
 *
 * Falls back gracefully when ANTHROPIC_API_KEY is not set.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  photoUrls: z.array(z.string().url()).min(1).max(10),
  stage: z.enum(['pickup', 'return']),
});

interface DamageItem {
  location: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
}

interface InspectionResult {
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  damages: DamageItem[];
  recommendation: string;
  confidence: number;
  stage: 'pickup' | 'return';
  inspectedAt: string;
  photoCount: number;
}

async function analyseWithClaude(photoUrls: string[], stage: 'pickup' | 'return'): Promise<InspectionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const stageContext = stage === 'pickup'
    ? 'These photos were taken at PICKUP (start of rental). Document the current condition as a baseline.'
    : 'These photos were taken at RETURN (end of rental). Identify any new damage compared to what a well-maintained car should look like.';

  if (!apiKey || apiKey === 'placeholder') {
    // Dev mode — return mock result
    console.log(`[AI Inspect DEV] ${stage} — ${photoUrls.length} photos`);
    return {
      condition: 'good',
      damages: photoUrls.length > 2 ? [
        { location: 'Front bumper', description: 'Minor scratch (pre-existing)', severity: 'minor' },
      ] : [],
      recommendation: stage === 'pickup'
        ? 'Vehicle appears in good condition. Proceed with rental.'
        : 'No significant new damage detected. Deposit can be released.',
      confidence: 0.87,
      stage,
      inspectedAt: new Date().toISOString(),
      photoCount: photoUrls.length,
    };
  }

  // Build vision content blocks — one per photo URL
  const imageBlocks = photoUrls.map(url => ({
    type: 'image' as const,
    source: { type: 'url' as const, url },
  }));

  const prompt = `You are an expert vehicle damage assessor for a car rental company in Rwanda.

${stageContext}

Analyse these ${photoUrls.length} vehicle photo(s) and respond ONLY with a valid JSON object in this exact format:
{
  "condition": "excellent" | "good" | "fair" | "poor",
  "damages": [
    {
      "location": "specific location on vehicle",
      "description": "brief description of damage",
      "severity": "minor" | "moderate" | "major"
    }
  ],
  "recommendation": "one sentence action recommendation",
  "confidence": 0.0 to 1.0
}

Rules:
- condition "excellent": no visible damage, clean
- condition "good": minor pre-existing scratches only
- condition "fair": visible damage needing attention
- condition "poor": significant damage
- damages array should be empty [] if no damage found
- confidence reflects how clearly you can assess from the photos provided
- Be conservative: only flag clear, unambiguous damage`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '{}';

  // Extract JSON from response (Claude sometimes wraps in markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    condition: parsed.condition || 'good',
    damages: parsed.damages || [],
    recommendation: parsed.recommendation || 'Inspection complete.',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
    stage,
    inspectedAt: new Date().toISOString(),
    photoCount: photoUrls.length,
  };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { photoUrls, stage } = schema.parse(body);

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        renterId: true,
        car: { select: { hostId: true } },
        status: true,
      },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isHost = booking.car.hostId === userId;
    const isRenter = booking.renterId === userId;

    if (!isHost && !isRenter && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await analyseWithClaude(photoUrls, stage);

    // Persist report and update inspection photos on booking
    const photoField = stage === 'pickup' ? 'inspectionPhotosPickup' : 'inspectionPhotosReturn';
    await prisma.booking.update({
      where: { id: params.id },
      data: {
        [photoField]: photoUrls,
        inspectionReport: result as any,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error('[AI Inspect] Error:', err);
    return NextResponse.json({ error: 'Inspection failed' }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    select: {
      renterId: true,
      inspectionReport: true,
      inspectionPhotosPickup: true,
      inspectionPhotosReturn: true,
      car: { select: { hostId: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (booking.renterId !== userId && booking.car.hostId !== userId && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    report: booking.inspectionReport,
    pickupPhotos: booking.inspectionPhotosPickup,
    returnPhotos: booking.inspectionPhotosReturn,
  });
}
