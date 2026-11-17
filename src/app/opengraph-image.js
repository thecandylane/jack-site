import { ImageResponse } from 'next/og';

export const alt = 'Jack Schliewe, AI developer and security engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GREEN = '#5dff8a', BG = '#030d07', DIM = '#5d8f6a';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', background: BG, fontFamily: 'monospace', border: `8px solid ${DIM}` }}>
        <div style={{ fontSize: '28px', color: GREEN }}>$ whoami</div>
        <div style={{ fontSize: '96px', fontWeight: 700, color: GREEN, marginTop: '16px' }}>Jack Schliewe</div>
        <div style={{ fontSize: '36px', color: '#c8f5d3', marginTop: '16px' }}>AI developer &amp; security engineer</div>
        <div style={{ fontSize: '24px', color: DIM, marginTop: '48px' }}>ref-radar: prior art for coding agents · ref.lookit.space</div>
      </div>
    ),
    { ...size }
  );
}
