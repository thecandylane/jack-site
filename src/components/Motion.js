'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Marks each .reveal section with .in as it scrolls into view, which starts its CSS motion (globals.css), and numbers
// the items inside it (--i) so they appear one after another.
const ITEMS = '.stats > div, .tools > li, .jobs > li, .card, .facts > li, .posts > li, .term';

export default function Motion() {
  const path = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -12% 0px' });
    for (const sec of document.querySelectorAll('.reveal:not(.in)')) {
      sec.querySelectorAll(ITEMS).forEach((el, i) => el.style.setProperty('--i', i % 8));
      io.observe(sec);
    }
    return () => io.disconnect();
  }, [path]);
  return null;
}
