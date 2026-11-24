'use client';

import { useState } from 'react';

// Click-to-load YouTube: a self-hosted poster until the visitor asks for the video, so a page view sends nothing to
// Google. The player is a plain React iframe on the privacy-enhanced nocookie host (CSP frame-src allows only it),
// with no IFrame API script and nothing laid over it once it plays.
export default function YouTubeFacade({ id, title, poster }) {
  const [on, setOn] = useState(false);
  return (
    <div className="fm-yt">
      {on ? (
        <iframe
          ref={(f) => f?.focus()}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`}
          title={title}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} aria-label={`Play: ${title}`}>
          <img src={poster} alt="" width="960" height="540" loading="lazy" />
          <span className="fm-play" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
