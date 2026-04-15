import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';

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

    const ext = file.name.split('.').pop() || 'jpg';
    const userId = (session.user as { id?: string }).id ?? 'unknown';
    const filename = `${bucket}/${userId}-${Date.now()}.${ext}`;

    // 1. Try Vercel Blob first
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      const blob = await put(filename, file, { access: 'public', token: blobToken });
      return NextResponse.json({ url: blob.url });
    }

    // 2. Try Supabase second
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && serviceKey) {
      const bytes = await file.arrayBuffer();
      const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${filename}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': file.type,
        },
        body: bytes,
      });

      if (!uploadRes.ok) throw new Error('Upload to Supabase failed');

      const url = `${supabaseUrl}/storage/v1/object/public/${filename}`;
      return NextResponse.json({ url });
    }

    // 3. DEMO DATA fallback — configure BLOB_READ_WRITE_TOKEN or SUPABASE credentials in production
    const devMaxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > devMaxSize) {
      return NextResponse.json(
        { error: 'Please use Supabase or Vercel Blob in production' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    return NextResponse.json({ url: `data:${file.type};base64,${base64}` });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
