import { redirect } from 'next/navigation';

// Canonical URL is /4x4-safari-rwanda — this slug is a SEO alias
export default function SafariCarsRwandaPage() {
  redirect('/4x4-safari-rwanda');
}
