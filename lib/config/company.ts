export const SITE_URL = 'https://gari-africa.com';
export const CONTACT_EMAIL = 'hello@gari-africa.com';
export const PARTNER_COMMISSION_RATE = 8; // percent

export const COMPANY = {
  name: 'Gari Technologies Ltd.',
  phone: '+250 788 123 000',
  whatsapp: '250788123000',
  whatsappUrl: 'https://wa.me/250788123000',
  email: CONTACT_EMAIL,
  address: 'KG 11 Ave, Kigali, Rwanda',
  instagram: 'https://instagram.com/gari_africa',
  twitter: 'https://twitter.com/garirwanda',
  founded: '2025',
} as const;

/** Pre-filled WhatsApp message link */
export function waLink(message: string): string {
  return `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(message)}`;
}
