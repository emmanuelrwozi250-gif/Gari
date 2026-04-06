import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'car-photos';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP allowed.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      // Return a placeholder URL in development
      return NextResponse.json({ url: `https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800` });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${(session.user as any).id}-${Date.now()}.${ext}`;
    const path = `${bucket}/${filename}`;

    const bytes = await file.arrayBuffer();
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': file.type,
      },
      body: bytes,
    });

    if (!uploadRes.ok) throw new Error('Upload to Supabase failed');

    const url = `${supabaseUrl}/storage/v1/object/public/${path}`;
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
