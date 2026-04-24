export const COMPANY = {
  name: 'Gari Technologies Ltd.',
  phone: '+250 788 123 000',
  whatsapp: '250788123000',
  whatsappUrl: 'https://wa.me/250788123000',
  email: 'hello@gari.rw',
  address: 'KG 11 Ave, Kigali, Rwanda',
  instagram: 'https://instagram.com/gari.rw',
  twitter: 'https://twitter.com/garirwanda',
  founded: '2026',
} as const;

/** Pre-filled WhatsApp message link */
export function waLink(message: string): string {
  return `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(message)}`;
}
