import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#030d07',
          borderRadius: '36px',
        }}
      >
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '90px',
            fontWeight: 700,
            color: '#5dff8a',
          }}
        >
          JS
        </div>
      </div>
    ),
    { ...size }
  );
}
