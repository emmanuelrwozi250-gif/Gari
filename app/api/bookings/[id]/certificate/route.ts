/**
 * GET /api/bookings/:id/certificate
 * Returns a rendered HTML insurance certificate for a confirmed booking.
 * Designed for print-to-PDF (window.print() or Puppeteer headless).
 * Only accessible by the booking renter, host, or admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate, formatRWF } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function esc(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  let booking;
  try {
    booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        car: { include: { host: { select: { name: true, phone: true, email: true } } } },
        renter: { select: { name: true, email: true, phone: true, nidaNumber: true } },
      },
    });
  } catch {
    return new NextResponse('Database error', { status: 500 });
  }

  if (!booking) return new NextResponse('Booking not found', { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (booking.renterId !== userId && booking.car.hostId !== userId && role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(booking.status)) {
    return new NextResponse('Certificate not available for this booking status', { status: 400 });
  }

  const certNumber = `GARI-INS-${booking.id.slice(0, 8).toUpperCase()}`;
  const issueDate = new Date().toLocaleDateString('en-RW', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Gari Insurance Certificate — ${certNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Inter,sans-serif;background:#f4f6f8;color:#1a2332;print-color-adjust:exact;-webkit-print-color-adjust:exact}
    .page{max-width:800px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.10)}
    .header{background:#0f1923;padding:28px 40px;display:flex;justify-content:space-between;align-items:center}
    .logo{font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px}
    .logo span.i{color:#f5c518}
    .logo span.dot{color:#1a7a4a;font-size:16px}
    .cert-label{background:#1a7a4a;color:#fff;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:6px 16px;border-radius:20px;text-transform:uppercase}
    .green-band{background:#1a7a4a;padding:14px 40px;display:flex;justify-content:space-between;align-items:center}
    .green-band .title{color:#fff;font-size:18px;font-weight:700}
    .green-band .cert-no{color:rgba(255,255,255,0.8);font-size:13px;font-family:monospace}
    .body{padding:36px 40px}
    .notice{background:#f0faf4;border-left:4px solid #1a7a4a;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:28px;font-size:13.5px;line-height:1.6;color:#1a4a2e}
    .section-title{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8a9ab8;margin-bottom:12px;margin-top:24px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
    .field{background:#f8fafc;border-radius:8px;padding:12px 16px}
    .field-label{font-size:11px;color:#8a9ab8;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px}
    .field-value{font-size:14px;font-weight:600;color:#1a2332}
    .coverage-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px}
    .coverage-item{display:flex;align-items:flex-start;gap:10px;background:#f8fafc;border-radius:8px;padding:12px 14px}
    .check{width:20px;height:20px;background:#1a7a4a;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
    .check::after{content:'✓';color:#fff;font-size:11px;font-weight:700}
    .coverage-text{font-size:13px;font-weight:500;color:#1a2332}
    .coverage-sub{font-size:11px;color:#8a9ab8;margin-top:2px}
    .exclusion-list{list-style:none;margin-top:8px}
    .exclusion-list li{font-size:13px;color:#5a6a7e;padding:5px 0;border-bottom:1px solid #f0f4f8;display:flex;gap:8px}
    .exclusion-list li::before{content:'×';color:#ef4444;font-weight:700;flex-shrink:0}
    .divider{border:none;border-top:1px solid #e8edf3;margin:24px 0}
    .sig-row{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:8px}
    .sig-box{text-align:center}
    .sig-line{border-top:2px solid #1a2332;margin:40px 0 8px}
    .sig-name{font-size:13px;font-weight:600}
    .sig-role{font-size:11px;color:#8a9ab8}
    .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:72px;font-weight:900;color:rgba(26,122,74,0.04);white-space:nowrap;pointer-events:none;z-index:0}
    .footer{background:#f4f6f8;padding:16px 40px;font-size:11px;color:#8a9ab8;border-top:1px solid #e2e8ef;display:flex;justify-content:space-between}
    .amount-highlight{font-size:22px;font-weight:800;color:#1a7a4a}
    @media print{
      body{background:#fff}
      .page{box-shadow:none;margin:0;border-radius:0}
      .print-btn{display:none}
    }
    .print-btn{position:fixed;top:20px;right:20px;background:#1a7a4a;color:#fff;border:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;z-index:10}
  </style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Print / Save PDF</button>
<div class="watermark">GARI VERIFIED</div>
<div class="page">
  <div class="header">
    <span class="logo">Gar<span class="i">i</span><span class="dot">•</span></span>
    <span class="cert-label">Insurance Certificate</span>
  </div>
  <div class="green-band">
    <span class="title">Third-Party Liability &amp; Collision Damage Waiver</span>
    <span class="cert-no">${certNumber}</span>
  </div>
  <div class="body">
    <div class="notice">
      This certificate confirms that the vehicle described below is covered under Gari's standard rental protection policy for the duration of the booking. This document must be carried in the vehicle during the rental period.
    </div>

    <div class="section-title">Insured Party (Renter)</div>
    <div class="grid">
      <div class="field"><div class="field-label">Full Name</div><div class="field-value">${esc(booking.renter.name) || '—'}</div></div>
      <div class="field"><div class="field-label">Email</div><div class="field-value">${esc(booking.renter.email)}</div></div>
      <div class="field"><div class="field-label">Phone</div><div class="field-value">${esc(booking.renter.phone) || '—'}</div></div>
      <div class="field"><div class="field-label">National ID (NIDA)</div><div class="field-value">${esc(booking.renter.nidaNumber) || 'Not Provided'}</div></div>
    </div>

    <div class="section-title">Vehicle Details</div>
    <div class="grid-3">
      <div class="field"><div class="field-label">Vehicle</div><div class="field-value">${esc(String(booking.car.year))} ${esc(booking.car.make)} ${esc(booking.car.model)}</div></div>
      <div class="field"><div class="field-label">Type</div><div class="field-value">${esc(booking.car.type.replace(/_/g, ' '))}</div></div>
      <div class="field"><div class="field-label">Fuel</div><div class="field-value">${esc(booking.car.fuel)}</div></div>
      <div class="field"><div class="field-label">Seats</div><div class="field-value">${booking.car.seats}</div></div>
      <div class="field"><div class="field-label">District</div><div class="field-value">${esc(booking.car.district)}</div></div>
      <div class="field"><div class="field-label">With Driver</div><div class="field-value">${booking.withDriver ? 'Yes' : 'No'}</div></div>
    </div>

    <div class="section-title">Rental Period &amp; Financials</div>
    <div class="grid-3">
      <div class="field"><div class="field-label">Pickup Date</div><div class="field-value">${formatDate(booking.pickupDate)}</div></div>
      <div class="field"><div class="field-label">Return Date</div><div class="field-value">${formatDate(booking.returnDate)}</div></div>
      <div class="field"><div class="field-label">Duration</div><div class="field-value">${booking.totalDays} day${booking.totalDays > 1 ? 's' : ''}</div></div>
      <div class="field"><div class="field-label">Pickup Location</div><div class="field-value">${booking.pickupLocation}</div></div>
      <div class="field"><div class="field-label">Booking Ref</div><div class="field-value" style="font-family:monospace">${certNumber}</div></div>
      <div class="field"><div class="field-label">Total Paid</div><div class="amount-highlight">${formatRWF(booking.totalAmount)}</div></div>
    </div>

    <div class="section-title">Coverage Included</div>
    <div class="coverage-grid">
      <div class="coverage-item"><div class="check"></div><div><div class="coverage-text">Third-Party Liability</div><div class="coverage-sub">Up to RWF 5,000,000 per incident</div></div></div>
      <div class="coverage-item"><div class="check"></div><div><div class="coverage-text">Collision Damage Waiver (CDW)</div><div class="coverage-sub">Excess: RWF ${booking.depositAmount > 0 ? booking.depositAmount.toLocaleString() : '200,000'}</div></div></div>
      <div class="coverage-item"><div class="check"></div><div><div class="coverage-text">Theft Protection</div><div class="coverage-sub">Full vehicle value covered</div></div></div>
      <div class="coverage-item"><div class="check"></div><div><div class="coverage-text">Roadside Assistance</div><div class="coverage-sub">24/7 breakdown support</div></div></div>
      <div class="coverage-item"><div class="check"></div><div><div class="coverage-text">Windscreen &amp; Glass</div><div class="coverage-sub">Repair or replacement</div></div></div>
      <div class="coverage-item"><div class="check"></div><div><div class="coverage-text">Personal Accident</div><div class="coverage-sub">Driver &amp; passengers</div></div></div>
    </div>

    <div class="section-title">Exclusions</div>
    <ul class="exclusion-list">
      <li>Damage caused while driving under influence of alcohol or drugs</li>
      <li>Off-road driving not agreed in advance</li>
      <li>Damage to tyres and rims from negligence</li>
      <li>Cross-border travel without prior written approval</li>
      <li>Commercial use beyond agreed rental purpose</li>
    </ul>

    <hr class="divider" />
    <div class="section-title">Authorised Signatures</div>
    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-name">Gari Marketplace Ltd.</div>
        <div class="sig-role">Policy Issuer · Kigali, Rwanda</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-name">${esc(booking.car.host.name) || 'Vehicle Owner'}</div>
        <div class="sig-role">Vehicle Host</div>
      </div>
    </div>

    <hr class="divider" />
    <p style="font-size:11px;color:#8a9ab8;line-height:1.6;margin-top:4px">
      This certificate is issued subject to the full Gari Rental Protection Terms and Conditions available at <strong>gari.rw/terms</strong>.
      In case of an incident, call the Gari emergency line immediately. Do not admit liability to third parties.
      Certificate issued: ${issueDate}.
    </p>
  </div>
  <div class="footer">
    <span>Gari Marketplace Ltd. · KG 11 Ave, Kigali, Rwanda</span>
    <span>support@gari.rw · gari.rw</span>
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
