import { formatRWF, formatDate } from '@/lib/utils';

export type NotificationEvent =
  | 'booking.created'         // → host: new request
  | 'booking.confirmed'       // → renter: host accepted
  | 'booking.declined'        // → renter: host declined
  | 'booking.paid'            // → host: payment received
  | 'booking.review_reminder' // → renter: leave a review after trip
  | 'trip.starting'           // → renter: 1hr before pickup
  | 'trip.ending'             // → renter: return reminder
  | 'dispute.opened'          // → both parties
  | 'damage.reported';        // → renter

export interface BookingTemplateData {
  bookingId: string;
  bookingRef?: string;          // short ref e.g. GARI-XXXXXXXX
  renterName?: string;
  hostName?: string;
  hostPhone?: string;
  carMake?: string;
  carModel?: string;
  carYear?: number;
  pickupDate?: Date | string;
  returnDate?: Date | string;
  totalDays?: number;
  totalAmount?: number;
  pickupLocation?: string;
  damageDescription?: string;
  disputeReason?: string;
  appUrl?: string;
}

type Lang = 'en' | 'rw' | 'fr';

interface Template {
  subject: string;          // email subject
  whatsapp: string;         // WhatsApp message body
  email: string;            // email HTML (minimal)
  inApp: { title: string; message: string };
}

function bookingUrl(bookingId: string, appUrl: string) {
  return `${appUrl}/book/${bookingId}`;
}

function shortRef(bookingId: string) {
  return bookingId.slice(0, 8).toUpperCase();
}

// ─── ENGLISH TEMPLATES ──────────────────────────────────────────────────────

const en = {
  'booking.created': (d: BookingTemplateData): Template => ({
    subject: `New booking request — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `🚗 *New Booking Request!*`,
      ``,
      `*Car:* ${d.carYear} ${d.carMake} ${d.carModel}`,
      `*Renter:* ${d.renterName}`,
      `*Pickup:* ${formatDate(d.pickupDate!)}`,
      `*Return:* ${formatDate(d.returnDate!)} (${d.totalDays} day${d.totalDays !== 1 ? 's' : ''})`,
      `*Location:* ${d.pickupLocation}`,
      `*Total:* ${formatRWF(d.totalAmount!)}`,
      `*Ref:* ${shortRef(d.bookingId)}`,
      ``,
      `Reply with:`,
      `*1* — ✅ Accept`,
      `*2* — ❌ Decline`,
      `*3* — 🔗 View details`,
    ].join('\n'),
    email: `<p>You have a new booking request for your <b>${d.carYear} ${d.carMake} ${d.carModel}</b>.</p>
<p><b>Renter:</b> ${d.renterName}<br/>
<b>Dates:</b> ${formatDate(d.pickupDate!)} — ${formatDate(d.returnDate!)}<br/>
<b>Total:</b> ${formatRWF(d.totalAmount!)}</p>
<p><a href="${bookingUrl(d.bookingId, d.appUrl!)}">Review &amp; respond →</a></p>`,
    inApp: {
      title: 'New booking request',
      message: `${d.renterName} wants to rent your ${d.carMake} ${d.carModel} from ${formatDate(d.pickupDate!)}`,
    },
  }),

  'booking.confirmed': (d: BookingTemplateData): Template => ({
    subject: `Booking confirmed — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `✅ *Booking Confirmed!*`,
      ``,
      `Your *${d.carYear} ${d.carMake} ${d.carModel}* is booked.`,
      ``,
      `📅 *Pickup:* ${formatDate(d.pickupDate!)}`,
      `📅 *Return:* ${formatDate(d.returnDate!)}`,
      `📍 *Location:* ${d.pickupLocation}`,
      `💰 *Total paid:* ${formatRWF(d.totalAmount!)}`,
      `🔖 *Ref:* ${shortRef(d.bookingId)}`,
      ``,
      `Your host *${d.hostName}* will contact you 1 hour before pickup.`,
      ``,
      `View booking: ${bookingUrl(d.bookingId, d.appUrl!)}`,
    ].join('\n'),
    email: `<p>Great news! Your booking has been confirmed.</p>
<p><b>Car:</b> ${d.carYear} ${d.carMake} ${d.carModel}<br/>
<b>Host:</b> ${d.hostName}<br/>
<b>Pickup:</b> ${formatDate(d.pickupDate!)}<br/>
<b>Return:</b> ${formatDate(d.returnDate!)}<br/>
<b>Location:</b> ${d.pickupLocation}<br/>
<b>Total:</b> ${formatRWF(d.totalAmount!)}</p>
<p><a href="${bookingUrl(d.bookingId, d.appUrl!)}">View your booking →</a></p>`,
    inApp: {
      title: 'Booking confirmed! 🎉',
      message: `Your ${d.carMake} ${d.carModel} is confirmed for ${formatDate(d.pickupDate!)}`,
    },
  }),

  'booking.declined': (d: BookingTemplateData): Template => ({
    subject: `Booking declined — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `❌ *Booking Declined*`,
      ``,
      `Unfortunately, *${d.hostName}* was unable to accept your request for the *${d.carMake} ${d.carModel}*.`,
      ``,
      `You have not been charged. Browse other available cars:`,
      `${d.appUrl}/search`,
    ].join('\n'),
    email: `<p>Your booking request for the ${d.carMake} ${d.carModel} was declined by the host.</p>
<p>You have not been charged. <a href="${d.appUrl}/search">Browse other cars →</a></p>`,
    inApp: {
      title: 'Booking declined',
      message: `Your request for ${d.carMake} ${d.carModel} was declined. You have not been charged.`,
    },
  }),

  'booking.paid': (d: BookingTemplateData): Template => ({
    subject: `Payment received — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `💰 *Payment Received!*`,
      ``,
      `*${d.renterName}* has paid for your *${d.carYear} ${d.carMake} ${d.carModel}*.`,
      ``,
      `💵 *Amount:* ${formatRWF(d.totalAmount!)}`,
      `📅 *Pickup:* ${formatDate(d.pickupDate!)}`,
      `📍 *Location:* ${d.pickupLocation}`,
      `🔖 *Ref:* ${shortRef(d.bookingId)}`,
      ``,
      `Earnings will be released after trip completion.`,
    ].join('\n'),
    email: `<p>Payment received for your <b>${d.carMake} ${d.carModel}</b>.</p>
<p><b>Renter:</b> ${d.renterName}<br/>
<b>Amount:</b> ${formatRWF(d.totalAmount!)}<br/>
<b>Pickup date:</b> ${formatDate(d.pickupDate!)}</p>`,
    inApp: {
      title: 'Payment received',
      message: `${d.renterName} paid ${formatRWF(d.totalAmount!)} for your ${d.carMake} ${d.carModel}`,
    },
  }),

  'trip.starting': (d: BookingTemplateData): Template => ({
    subject: `Trip starts in 1 hour — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `⏰ *Pickup Reminder — 1 Hour Away!*`,
      ``,
      `Your *${d.carYear} ${d.carMake} ${d.carModel}* pickup is in *1 hour*.`,
      ``,
      `📍 *Location:* ${d.pickupLocation}`,
      `📞 *Host:* ${d.hostName}${d.hostPhone ? ` (${d.hostPhone})` : ''}`,
      ``,
      `Have a safe trip! 🙏`,
    ].join('\n'),
    email: `<p>Your car pickup is in 1 hour.</p>
<p><b>Car:</b> ${d.carMake} ${d.carModel}<br/>
<b>Location:</b> ${d.pickupLocation}<br/>
<b>Host contact:</b> ${d.hostName}${d.hostPhone ? ` — ${d.hostPhone}` : ''}</p>`,
    inApp: {
      title: 'Pickup in 1 hour ⏰',
      message: `Your ${d.carMake} ${d.carModel} pickup is at ${d.pickupLocation}`,
    },
  }),

  'trip.ending': (d: BookingTemplateData): Template => ({
    subject: `Return reminder — ${d.carMake} ${d.carModel} due today`,
    whatsapp: [
      `🔔 *Return Reminder*`,
      ``,
      `Your *${d.carYear} ${d.carMake} ${d.carModel}* is due back *today* (${formatDate(d.returnDate!)}).`,
      ``,
      `Please return the car on time and with a full tank to avoid extra charges.`,
      ``,
      `📞 Need to extend? Contact your host: ${d.hostName}${d.hostPhone ? ` (${d.hostPhone})` : ''}`,
    ].join('\n'),
    email: `<p>Reminder: your rental ends today (${formatDate(d.returnDate!)}).</p>
<p>Please return the <b>${d.carMake} ${d.carModel}</b> on time and with a full tank.</p>`,
    inApp: {
      title: 'Return due today',
      message: `Your ${d.carMake} ${d.carModel} is due back today. Please return on time.`,
    },
  }),

  'dispute.opened': (d: BookingTemplateData): Template => ({
    subject: `Dispute opened — Booking ${shortRef(d.bookingId)}`,
    whatsapp: [
      `⚠️ *Dispute Opened*`,
      ``,
      `A dispute has been filed for booking *${shortRef(d.bookingId)}*.`,
      d.disputeReason ? `\nReason: ${d.disputeReason}` : '',
      ``,
      `Our support team will contact you within 24 hours.`,
      `📞 Or reach us on WhatsApp: +250788123000`,
    ].filter(Boolean).join('\n'),
    email: `<p>A dispute has been opened for booking <b>${shortRef(d.bookingId)}</b>.</p>
<p>Our support team will contact you within 24 hours.</p>`,
    inApp: {
      title: 'Dispute opened',
      message: `A dispute has been filed for booking ${shortRef(d.bookingId)}. Support will contact you.`,
    },
  }),

  'booking.review_reminder': (d: BookingTemplateData): Template => ({
    subject: `How was your trip? Leave a review for ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `⭐ *How was your Gari trip?*`,
      ``,
      `You recently rented a *${d.carYear} ${d.carMake} ${d.carModel}*.`,
      ``,
      `Leaving a review takes 30 seconds and helps other Rwandans make better decisions.`,
      ``,
      `👉 Leave your review: ${bookingUrl(d.bookingId, d.appUrl!)}`,
      ``,
      `Thank you, ${d.renterName?.split(' ')[0]}! 🙏`,
    ].join('\n'),
    email: `<p>Hi ${d.renterName?.split(' ')[0]},</p>
<p>We hope you enjoyed your <b>${d.carYear} ${d.carMake} ${d.carModel}</b> rental.</p>
<p>Would you take 30 seconds to leave a review? It helps other renters and rewards great hosts.</p>
<p><a href="${bookingUrl(d.bookingId, d.appUrl!)}">Leave a review →</a></p>
<p>Thank you! 🙏<br/>The Gari Team</p>`,
    inApp: {
      title: 'How was your trip? ⭐',
      message: `You just completed your ${d.carMake} ${d.carModel} rental. Tap to leave a review.`,
    },
  }),

  'damage.reported': (d: BookingTemplateData): Template => ({
    subject: `Damage report filed — Booking ${shortRef(d.bookingId)}`,
    whatsapp: [
      `⚠️ *Damage Report Filed*`,
      ``,
      `Your host has filed a damage report for booking *${shortRef(d.bookingId)}*.`,
      d.damageDescription ? `\n_"${d.damageDescription}"_` : '',
      ``,
      `Your security deposit is under review. Our team will reach out within 24 hours.`,
      ``,
      `Questions? Reply here or visit: ${bookingUrl(d.bookingId, d.appUrl!)}`,
    ].filter(Boolean).join('\n'),
    email: `<p>A damage report has been filed for your rental (booking <b>${shortRef(d.bookingId)}</b>).</p>
${d.damageDescription ? `<p><b>Description:</b> ${d.damageDescription}</p>` : ''}
<p>Your security deposit is under review. Our team will contact you within 24 hours.</p>`,
    inApp: {
      title: 'Damage report filed',
      message: `A damage report was filed for booking ${shortRef(d.bookingId)}. Deposit under review.`,
    },
  }),
};

// ─── KINYARWANDA TEMPLATES ───────────────────────────────────────────────────

const rw = {
  'booking.created': (d: BookingTemplateData): Template => ({
    subject: `Inyandiko nshya — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `🚗 *Inyandiko Nshya y'Ubukodesha!*`,
      ``,
      `*Imodoka:* ${d.carYear} ${d.carMake} ${d.carModel}`,
      `*Ukodesha:* ${d.renterName}`,
      `*Kwakira:* ${formatDate(d.pickupDate!)}`,
      `*Gusubiza:* ${formatDate(d.returnDate!)} (${d.totalDays} umunsi${d.totalDays !== 1 ? '' : ''})`,
      `*Ahantu:* ${d.pickupLocation}`,
      `*Igiteranyo:* ${formatRWF(d.totalAmount!)}`,
      `*Nimero:* ${shortRef(d.bookingId)}`,
      ``,
      `Subiza:`,
      `*1* — ✅ Emeza`,
      `*2* — ❌ Anga`,
      `*3* — 🔗 Reba ibisobanuro`,
    ].join('\n'),
    email: en['booking.created'](d).email,
    inApp: {
      title: 'Inyandiko nshya y\'ubukodesha',
      message: `${d.renterName} ashaka gukodesha ${d.carMake} ${d.carModel} uhereye ${formatDate(d.pickupDate!)}`,
    },
  }),

  'booking.confirmed': (d: BookingTemplateData): Template => ({
    subject: `Ubukodesha bwemejwe — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `✅ *Ubukodesha Bwemejwe!*`,
      ``,
      `*${d.carYear} ${d.carMake} ${d.carModel}* yawe ibukodeshwa.`,
      ``,
      `📅 *Kwakira:* ${formatDate(d.pickupDate!)}`,
      `📅 *Gusubiza:* ${formatDate(d.returnDate!)}`,
      `📍 *Ahantu:* ${d.pickupLocation}`,
      `💰 *Wishyuye:* ${formatRWF(d.totalAmount!)}`,
      `🔖 *Nimero:* ${shortRef(d.bookingId)}`,
      ``,
      `Umukiranyi *${d.hostName}* azatumanahana nawe isaha imwe mbere yo kwakira imodoka.`,
      ``,
      `Reba ubukodesha: ${bookingUrl(d.bookingId, d.appUrl!)}`,
    ].join('\n'),
    email: en['booking.confirmed'](d).email,
    inApp: {
      title: 'Ubukodesha bwemejwe! 🎉',
      message: `${d.carMake} ${d.carModel} yawe yemejwe kuwa ${formatDate(d.pickupDate!)}`,
    },
  }),

  'booking.declined': (d: BookingTemplateData): Template => ({
    subject: `Ubukodesha bwanzwe — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `❌ *Ubukodesha Bwanzwe*`,
      ``,
      `*${d.hostName}* ntashoboye kwakira inyandiko yawe ya *${d.carMake} ${d.carModel}*.`,
      ``,
      `Nta mafaranga yafashwe. Shakisha izindi modoka:`,
      `${d.appUrl}/search`,
    ].join('\n'),
    email: en['booking.declined'](d).email,
    inApp: {
      title: 'Ubukodesha bwanzwe',
      message: `Inyandiko yawe ya ${d.carMake} ${d.carModel} yanzwe. Nta mafaranga yafashwe.`,
    },
  }),

  'booking.paid': (d: BookingTemplateData): Template => ({
    subject: `Amafaranga yakiriwe — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `💰 *Amafaranga Yakiriwe!*`,
      ``,
      `*${d.renterName}* wishyuye *${d.carYear} ${d.carMake} ${d.carModel}* yawe.`,
      ``,
      `💵 *Ingano:* ${formatRWF(d.totalAmount!)}`,
      `📅 *Kwakira:* ${formatDate(d.pickupDate!)}`,
      `📍 *Ahantu:* ${d.pickupLocation}`,
      ``,
      `Amafaranga azarekurwa nyuma y'urugendo rurarangiye.`,
    ].join('\n'),
    email: en['booking.paid'](d).email,
    inApp: {
      title: 'Amafaranga yakiriwe',
      message: `${d.renterName} wishyuye ${formatRWF(d.totalAmount!)} ya ${d.carMake} ${d.carModel} yawe`,
    },
  }),

  'trip.starting': (d: BookingTemplateData): Template => ({
    subject: `Urugendo rutangirira mu isaha imwe — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `⏰ *Igihe cyo Kwakira Imodoka — Isaha 1 Gusa!*`,
      ``,
      `Kwakira *${d.carYear} ${d.carMake} ${d.carModel}* ni mu *isaha imwe*.`,
      ``,
      `📍 *Ahantu:* ${d.pickupLocation}`,
      `📞 *Umukiranyi:* ${d.hostName}${d.hostPhone ? ` (${d.hostPhone})` : ''}`,
      ``,
      `Gende neza! 🙏`,
    ].join('\n'),
    email: en['trip.starting'](d).email,
    inApp: {
      title: 'Kwakira mu isaha 1 ⏰',
      message: `Kwakira ${d.carMake} ${d.carModel} ni kuri ${d.pickupLocation}`,
    },
  }),

  'trip.ending': (d: BookingTemplateData): Template => ({
    subject: `Igihe cyo gusubiza imodoka — ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `🔔 *Igihe cyo Gusubiza Imodoka*`,
      ``,
      `*${d.carYear} ${d.carMake} ${d.carModel}* isubizwa *uyu munsi* (${formatDate(d.returnDate!)}).`,
      ``,
      `Subiza imodoka mu gihe kandi yuzuye lisansi kugirango wirinde amafaranga y'inyongera.`,
      ``,
      `📞 Ugomba kongereza? Tumanahana n'umukiranyi: ${d.hostName}${d.hostPhone ? ` (${d.hostPhone})` : ''}`,
    ].join('\n'),
    email: en['trip.ending'](d).email,
    inApp: {
      title: 'Gusubiza uyu munsi',
      message: `${d.carMake} ${d.carModel} isubizwa uyu munsi. Subiza mu gihe.`,
    },
  }),

  'dispute.opened': (d: BookingTemplateData): Template => ({
    subject: `Ikibazo cyafunguwe — Inyandiko ${shortRef(d.bookingId)}`,
    whatsapp: [
      `⚠️ *Ikibazo Cyafunguwe*`,
      ``,
      `Ikibazo cyafunguwe ku nyandiko *${shortRef(d.bookingId)}*.`,
      d.disputeReason ? `\nImpamvu: ${d.disputeReason}` : '',
      ``,
      `Itsinda ryacu ry'inkunga rizatumanahana nawe mu masaha 24.`,
    ].filter(Boolean).join('\n'),
    email: en['dispute.opened'](d).email,
    inApp: {
      title: 'Ikibazo cyafunguwe',
      message: `Ikibazo cyafunguwe ku nyandiko ${shortRef(d.bookingId)}. Inkunga izatumanahana nawe.`,
    },
  }),

  'booking.review_reminder': (d: BookingTemplateData): Template => ({
    subject: `Urugendo rwagenze bite? Tanga igitekerezo ku ${d.carMake} ${d.carModel}`,
    whatsapp: [
      `⭐ *Urugendo rwawe rwa Gari rwagenze bite?*`,
      ``,
      `Wakodeshe *${d.carYear} ${d.carMake} ${d.carModel}* vuba aha.`,
      ``,
      `Gutanga igitekerezo bitwara amasegonda 30 kandi bifasha abandi Banyarwanda guhitamo neza.`,
      ``,
      `👉 Tanga igitekerezo: ${bookingUrl(d.bookingId, d.appUrl!)}`,
      ``,
      `Murakoze, ${d.renterName?.split(' ')[0]}! 🙏`,
    ].join('\n'),
    email: en['booking.review_reminder'](d).email,
    inApp: {
      title: 'Urugendo rwagenze bite? ⭐',
      message: `Warangije gukodesha ${d.carMake} ${d.carModel}. Kanda hano gutanga igitekerezo.`,
    },
  }),

  'damage.reported': (d: BookingTemplateData): Template => ({
    subject: `Raporo y'ingaruka yatanzwe — Inyandiko ${shortRef(d.bookingId)}`,
    whatsapp: [
      `⚠️ *Raporo y'Ingaruka Yatanzwe*`,
      ``,
      `Umukiranyi wawe yatanze raporo y'ingaruka ku nyandiko *${shortRef(d.bookingId)}*.`,
      d.damageDescription ? `\n_"${d.damageDescription}"_` : '',
      ``,
      `Ingwate yawe iri mu isesengura. Itsinda ryacu rizatumanahana nawe mu masaha 24.`,
    ].filter(Boolean).join('\n'),
    email: en['damage.reported'](d).email,
    inApp: {
      title: 'Raporo y\'ingaruka yatanzwe',
      message: `Raporo y'ingaruka yatanzwe ku nyandiko ${shortRef(d.bookingId)}. Ingwate mu isesengura.`,
    },
  }),
};

// ─── Template resolver ───────────────────────────────────────────────────────

const TEMPLATES: Record<Lang, Record<NotificationEvent, (d: BookingTemplateData) => Template>> = {
  en,
  rw,
  fr: en, // French falls back to English for now; add `fr` object when translated
};

export function getTemplate(
  event: NotificationEvent,
  lang: string,
  data: BookingTemplateData
): Template {
  const langKey = (lang in TEMPLATES ? lang : 'en') as Lang;
  return TEMPLATES[langKey][event](data);
}
