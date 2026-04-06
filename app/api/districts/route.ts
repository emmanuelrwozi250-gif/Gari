import { NextResponse } from 'next/server';
import { RWANDA_DISTRICTS, POPULAR_LOCATIONS } from '@/lib/districts';

export async function GET() {
  return NextResponse.json({ districts: RWANDA_DISTRICTS, popularLocations: POPULAR_LOCATIONS });
}
