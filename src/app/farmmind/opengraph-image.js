import { ImageResponse } from 'next/og';

// The /farmmind share card, drawn at build time like the posts' cards (satori: no double borders).
export const alt = 'FarmMind: product tour, Auto-Draw demo, tutorials and press';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GREEN = '#5dff8a', BG = '#030d07', DIM = '#5d8f6a';
const FM_BG = '#0A1F17', FM_CREAM = '#F5EFE0', FM_MINT = '#3DD4B0';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px', background: BG, fontFamily: 'monospace', border: `8px solid ${DIM}` }}>
        <div style={{ display: 'flex', fontSize: '26px', color: DIM }}>$ open farmmind</div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '40px 48px', background: FM_BG, border: `2px solid ${DIM}` }}>
          <div style={{ display: 'flex', fontSize: '80px', fontWeight: 700, color: FM_CREAM }}>FarmMind</div>
          <div style={{ display: 'flex', fontSize: '32px', color: FM_MINT, marginTop: '16px' }}>Product tour, Auto-Draw demo, tutorials and press</div>
        </div>
        <div style={{ display: 'flex', fontSize: '28px', color: GREEN }}>Jack Schliewe · schliewesystems.com/farmmind</div>
      </div>
    ),
    { ...size }
  );
}
