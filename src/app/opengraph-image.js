import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Jack Schliewe — Baton Rouge Technology Expert';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0a0a0a',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: '#c89b50',
          }}
        />
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            letterSpacing: '0.2em',
            color: '#c89b50',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}
        >
          Baton Rouge, Louisiana
        </div>
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '64px',
            fontWeight: 400,
            lineHeight: 1.1,
            color: '#ffffff',
            marginBottom: '32px',
          }}
        >
          Jack Schliewe
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '20px',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '800px',
          }}
        >
          Software. Industrial Controls. Cybersecurity. AI. Hardware.
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#c89b50',
            }}
          >
            JS://SCHLIEWE
          </div>
          <div
            style={{
              width: '1px',
              height: '20px',
              background: 'rgba(255,255,255,0.2)',
              marginLeft: '12px',
              marginRight: '12px',
            }}
          />
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            COMPLETE TECHNOLOGY RESOURCE
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
