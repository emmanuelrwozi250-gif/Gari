import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Gari — Rent a Car Anywhere in Rwanda';
  const subtitle = searchParams.get('sub') || 'Verified hosts · MTN MoMo · 30 districts';
  const price = searchParams.get('price');

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #0f1923 0%, #1a2e23 100%)',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(26,122,74,0.15) 0%, transparent 60%)',
        }} />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#1a7a4a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', color: 'white', fontWeight: 'bold',
          }}>G</div>
          <span style={{ fontSize: '32px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>
            Gar<span style={{ color: '#f5c518' }}>i</span>
          </span>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '12px' }}>
            Rwanda
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: price ? '52px' : '60px',
          fontWeight: '800',
          color: 'white',
          lineHeight: '1.1',
          maxWidth: '700px',
          letterSpacing: '-1px',
          marginBottom: '20px',
        }}>
          {title}
        </div>

        {/* Price badge */}
        {price && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(26,122,74,0.3)', border: '1px solid rgba(26,122,74,0.6)',
            borderRadius: '12px', padding: '8px 20px', marginBottom: '20px',
          }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#4ade80' }}>{price}</span>
            <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)' }}>/day</span>
          </div>
        )}

        {/* Subtitle */}
        <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.65)', marginBottom: '48px' }}>
          {subtitle}
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {['✓ NIDA Verified', '✓ MTN MoMo', '✓ Instant Booking'].map(badge => (
            <div key={badge} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.08)', borderRadius: '8px',
              padding: '6px 14px', fontSize: '14px', color: 'rgba(255,255,255,0.75)',
            }}>
              {badge}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute', bottom: '40px', right: '80px',
          fontSize: '18px', color: 'rgba(255,255,255,0.4)',
        }}>
          gari.rw
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
