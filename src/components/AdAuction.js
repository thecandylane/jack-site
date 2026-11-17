'use client';

import { useEffect, useState } from 'react';
import { read, sha, short } from '@/components/Fingerprint';

// Replays the bid request an ad exchange sends about you before an ad loads, as an OpenRTB 2.6 BidRequest
// (github.com/InteractiveAdvertisingBureau/openrtb2.x, 2.6.md) filled with your real values. Nothing is sent.
const uuid = () => crypto.randomUUID();

async function build() {
  const me = await fetch('/api/whoami', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({}));
  const n = navigator, ua = n.userAgentData;
  const hints = ua?.getHighEntropyValues ? await ua.getHighEntropyValues(['platformVersion', 'architecture', 'bitness', 'model', 'fullVersionList']).catch(() => null) : null;
  const id = short(await sha(JSON.stringify((await read()).map((r) => r.value))));
  const mobile = ua?.mobile ?? /Mobi/.test(n.userAgent);
  const geo = me.latitude ? {
    lat: Number(me.latitude), lon: Number(me.longitude),
    type: 2, // AdCOM Location Types: IP address
    country: me.country, // ponytail: alpha-2 as Cloudflare gives it; 2.6 asks for alpha-3, AdCOM accepts alpha-2
    region: me.regionCode, city: me.city, zip: me.postalCode, metro: me.metroCode,
    utcoffset: -new Date().getTimezoneOffset(),
  } : undefined;
  return {
    id: uuid(),
    at: 1, // first-price auction
    tmax: 120, // bidders get 120 ms to answer
    cur: ['USD'],
    imp: [{ id: '1', banner: { format: [{ w: 300, h: 250 }, { w: 728, h: 90 }] }, bidfloor: 0.5 }],
    site: { domain: location.hostname, page: location.href, ref: document.referrer || undefined, publisher: { id: 'pub-schliewesystems' } },
    device: {
      ua: n.userAgent,
      sua: hints ? {
        browsers: (hints.fullVersionList ?? []).map((b) => ({ brand: b.brand, version: b.version.split('.') })),
        platform: { brand: hints.platform ?? ua.platform, version: (hints.platformVersion ?? '').split('.') },
        mobile: mobile ? 1 : 0, architecture: hints.architecture, bitness: hints.bitness, model: hints.model || undefined, source: 2,
      } : undefined,
      geo,
      dnt: n.doNotTrack === '1' ? 1 : 0,
      ip: me.ip,
      devicetype: mobile ? 4 : 2, // AdCOM: 4 phone, 2 personal computer
      h: screen.height, w: screen.width, pxratio: devicePixelRatio, js: 1,
      langb: n.language,
    },
    user: { id, buyeruid: short(await sha(`dsp-${id}`)) },
    regs: { coppa: 0 },
  };
}

const NOTES = [
  ['device.ip and device.geo', 'Your address and the map point behind it. Every bidder gets them, whether or not it wins.'],
  ['device.ua and device.sua', 'Your exact browser and OS build: enough to pick an exploit, or a price.'],
  ['user.id', 'Here it is set to your browser fingerprint from above, so it is the same on every site that uses the same exchange.'],
  ['site.page', 'The page you are reading right now. Over time, the topics you read become the "interest segments" bidders buy.'],
  ['regs and device.dnt', 'The privacy signals. Do Not Track is in the request; whether a bidder honors it is up to the bidder.'],
];

export default function AdAuction() {
  const [req, setReq] = useState(null);
  useEffect(() => { build().then(setReq); }, []);
  return (
    <section className="fp">
      <h2 className="sec-h">The ad auction</h2>
      <p className="lede">
        On a site with ads, this is what happens before the ad appears. The ad exchange sends a bid request about you to
        every bidder it works with, and they have about a tenth of a second to bid. The losers keep the data too. Below is
        that request in the industry&apos;s own format, OpenRTB 2.6, filled in with your values. This page sends it nowhere.
      </p>
      <ul className="facts">
        {NOTES.map(([k, why]) => <li key={k}><span><code>{k}</code></span><span className="muted">{why}</span></li>)}
      </ul>
      <pre className="bid">{req ? JSON.stringify(req, null, 2) : 'building the request…'}</pre>
    </section>
  );
}
