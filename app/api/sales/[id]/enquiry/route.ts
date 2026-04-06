/**
 * POST /api/sales/:id/enquiry
 * Buyer submits an enquiry / offer on a sales listing.
 * Notifies seller via WhatsApp and in-app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendWhatsApp } from '@/lib/notifications/whatsapp';
import { z } from 'zod';

const schema = z.object({
  buyerName: z.string().min(2),
  buyerPhone: z.string().min(9),
  buyerWA: z.string().min(9),
  offerAmount: z.number().int().positive().optional(),
  message: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const listing = await prisma.salesListing.findUnique({
      where: { id: params.id },
      include: { seller: { select: { id: true, name: true, whatsappNumber: true, phone: true, preferredLanguage: true } } },
    });

    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    if (listing.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'This listing is no longer available' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    const enquiry = await prisma.salesEnquiry.create({
      data: {
        listingId: params.id,
        buyerId: (session?.user as any)?.id || null,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerWA: data.buyerWA,
        offerAmount: data.offerAmount,
        message: data.message,
      },
    });

    // Notify seller via WhatsApp
    const sellerPhone = listing.seller.whatsappNumber || listing.seller.phone;
    if (sellerPhone) {
      const lang = listing.seller.preferredLanguage || 'en';
      const offerLine = data.offerAmount
        ? `\n💰 Offer: RWF ${data.offerAmount.toLocaleString()}`
        : '';
      const msg =
        lang === 'rw'
          ? `🏷️ *Gari — Umuguzi Mushya*\n\nUmuntu witwa *${data.buyerName}* ashaka kugura *${listing.year} ${listing.make} ${listing.model}* wawe.${offerLine}\n📞 ${data.buyerPhone} | WhatsApp: ${data.buyerWA}\n\n${data.message || ''}\n\n_Subira umuguzi vuba!_`
          : `🏷️ *Gari — New Buyer Enquiry*\n\n*${data.buyerName}* is interested in your *${listing.year} ${listing.make} ${listing.model}*.${offerLine}\n📞 ${data.buyerPhone} | WhatsApp: ${data.buyerWA}\n\n${data.message || ''}\n\n_Reply directly to this buyer as soon as possible._`;

      void sendWhatsApp(sellerPhone, msg);
    }

    // Also save in-app notification for seller
    await prisma.notification.create({
      data: {
        userId: listing.seller.id,
        title: `New enquiry on your ${listing.make} ${listing.model}`,
        message: `${data.buyerName} is interested${data.offerAmount ? ` — offered RWF ${data.offerAmount.toLocaleString()}` : ''}`,
        type: 'sales_enquiry',
      },
    });

    return NextResponse.json({ success: true, enquiryId: enquiry.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit enquiry' }, { status: 500 });
  }
}
