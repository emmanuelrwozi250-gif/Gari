/**
 * POST /api/earn/leads — submit a Buy & Earn interest lead
 * Notifies Gari team via WhatsApp and stores in DB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsApp } from '@/lib/notifications/whatsapp';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  whatsapp: z.string().min(9),
  email: z.string().email().optional(),
  budgetMin: z.number().int().min(0),
  budgetMax: z.number().int().min(0),
  preferredType: z.string().min(1),
  timeline: z.enum(['immediate', '1-3months', '3-6months', '6months+']),
  notes: z.string().max(500).optional(),
  listingId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const lead = await prisma.buyEarnLead.create({
      data: {
        listingId: data.listingId || null,
        name: data.name,
        whatsapp: data.whatsapp,
        email: data.email,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        preferredType: data.preferredType,
        timeline: data.timeline,
        notes: data.notes,
      },
    });

    // Notify Gari team
    const teamPhone = process.env.GARI_TEAM_WHATSAPP;
    if (teamPhone) {
      void sendWhatsApp(
        teamPhone,
        `🚗 *New Buy & Earn Lead*\n\n👤 ${data.name}\n📱 ${data.whatsapp}\n💰 Budget: RWF ${data.budgetMin.toLocaleString()} – ${data.budgetMax.toLocaleString()}\n🚙 Type: ${data.preferredType}\n📅 Timeline: ${data.timeline}\n\n${data.notes || ''}`
      );
    }

    // Confirm to buyer
    void sendWhatsApp(
      data.whatsapp,
      `✅ *Gari — We've received your interest!*\n\nHi ${data.name}, thank you for expressing interest in our Buy & Earn program.\n\nOur team will contact you within 24 hours on WhatsApp to discuss options that match your budget and preferences.\n\n_gari.rw · Rwanda's Automotive Platform_`
    );

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
