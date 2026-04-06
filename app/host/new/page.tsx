import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ListCarForm } from './ListCarForm';

export const metadata: Metadata = { title: 'List Your Car — Gari' };

export default async function ListCarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/host/new');
  return <ListCarForm />;
}
