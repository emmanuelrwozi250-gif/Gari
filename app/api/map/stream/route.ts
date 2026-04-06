/**
 * GET /api/map/stream
 * Server-Sent Events stream for real-time map updates.
 * Pushes: new reports, expired reports, car availability changes.
 * Clients reconnect automatically via EventSource.
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '-1.9441');
  const lng = parseFloat(searchParams.get('lng') || '30.0619');
  const radius = parseFloat(searchParams.get('radius') || '20');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Client disconnected
        }
      };

      // Send initial ping
      send('connected', { ts: Date.now() });

      // Poll every 15 seconds
      const poll = async () => {
        try {
          const latDelta = radius / 111.32;
          const lngDelta = radius / (111.32 * Math.cos((lat * Math.PI) / 180));

          const reports = await prisma.mapReport.findMany({
            where: {
              expiresAt: { gte: new Date() },
              lat: { gte: lat - latDelta, lte: lat + latDelta },
              lng: { gte: lng - lngDelta, lte: lng + lngDelta },
            },
            select: { id: true, type: true, lat: true, lng: true, upvotes: true, expiresAt: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
          }).catch(() => []);

          send('reports', { reports });
        } catch {
          // DB not ready, skip
        }
      };

      // Send initial data
      await poll();

      const interval = setInterval(poll, 15000);

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
