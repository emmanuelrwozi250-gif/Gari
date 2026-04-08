import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Store subscriptions in DB (simplified — use a PushSubscription model in production)
// For now, log to console and return success so the client can proceed

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscription = await req.json();
  const userId = (session.user as any).id;

  // TODO: Store subscription endpoint + keys in database
  // await prisma.pushSubscription.upsert({ where: { userId }, ... })
  console.log(`[Push] Subscription registered for user ${userId}:`, subscription.endpoint?.slice(0, 50));

  return NextResponse.json({ success: true });
}
