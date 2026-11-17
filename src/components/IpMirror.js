'use client';

import { useEffect, useState } from 'react';

// Shows a visitor what the server saw of their connection (/api/whoami), then checks it against what their
// browser says. A VPN hides the IP, but the browser's clock and language still tell where you are.
const HOSTING = /amazon|aws|google|microsoft|azure|digitalocean|linode|akamai|ovh|hetzner|vultr|m247|datacamp|choopa|leaseweb|cloudflare|oracle|mullvad|proton|nord|surfshark|express|packethub|cdn77|tzulo/i;

// WebRTC asks a STUN server (Cloudflare's, developers.cloudflare.com/realtime/turn) for the address it sees.
// Some VPNs only tunnel normal traffic, so this answer can be your real IP.
function stunAddresses() {
  return new Promise((resolve) => {
    if (!window.RTCPeerConnection) return resolve(null);
    const found = new Set();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] });
    const done = () => { pc.close(); resolve([...found]); };
    pc.onicecandidate = (e) => {
      if (!e.candidate) return done();
      if (e.candidate.type === 'srflx' && e.candidate.address) found.add(e.candidate.address);
    };
    pc.createDataChannel('x');
    pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(done);
    setTimeout(done, 4000);
  });
}

export default function IpMirror() {
  const [me, setMe] = useState(null);
  const [rtc, setRtc] = useState(undefined);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch('/api/whoami', { cache: 'no-store' }).then((r) => r.json()).then(setMe).catch(() => setFailed(true));
    stunAddresses().then(setRtc);
  }, []);

  if (failed) return <p className="muted">The server could not be reached, so there is no IP to show.</p>;
  if (!me) return <p className="muted">asking the server what it saw…</p>;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const langRegion = (navigator.language.split('-')[1] ?? '').toUpperCase();
  const place = [me.city, me.region, me.postalCode, me.country].filter(Boolean).join(', ');
  const checks = [];
  if (me.timezone && me.timezone !== tz) checks.push(`Your IP says ${me.timezone}, but your browser's clock says ${tz}. Sites compare the two to spot a VPN or proxy, and the clock gives away where you really are.`);
  if (me.country && langRegion && me.country !== langRegion) checks.push(`Your IP is in ${me.country}, but your browser asks for ${navigator.language} pages. That mismatch is another VPN tell.`);
  if (me.asOrganization && HOSTING.test(me.asOrganization)) checks.push(`${me.asOrganization} runs data centers or VPNs, not home internet. Many sites block or flag addresses like yours.`);
  const v6 = (a) => a.includes(':');
  const leaked = (rtc ?? []).filter((a) => a !== me.ip && v6(a) === v6(me.ip ?? ''));
  if (leaked.length) checks.push(`WebRTC found ${leaked.join(', ')}, which is not the address this page loaded from. If you are on a VPN, that is your real IP leaking past it.`);
  if (!checks.length && me.timezone) checks.push('Your IP, clock and language all agree. To this site you look like a person at home, exactly where you are.');

  const rows = [
    ['IP address', me.ip ?? 'unknown', 'Sent with every request you make. It ties your visits together across sites and over time.'],
    ['Internet provider', me.asOrganization ? `${me.asOrganization} (AS${me.asn})` : 'not known here', 'Who to send a subpoena to for the name on the account.'],
    ['Location', place || 'not known here', 'Looked up from your IP by a GeoIP database. Often right to the city, sometimes to the postal code.'],
    ['Map point', me.latitude ? `${me.latitude}, ${me.longitude}` : 'not known here', 'The center of the area your IP maps to, not your house. Ad networks still use it for "near you".'],
    ['WebRTC', rtc === undefined ? 'asking a STUN server…' : rtc === null ? 'WebRTC is off in this browser' : rtc.length ? rtc.join(', ') : 'no public address found (blocked, or the STUN request timed out)', 'The address a STUN server sees when your browser opens a peer-to-peer connection, which any page can do without asking.'],
    ['Network', [me.colo && `nearest Cloudflare data center ${me.colo}`, me.clientTcpRtt && `${me.clientTcpRtt} ms away`, me.httpProtocol, me.tlsVersion].filter(Boolean).join(', ') || 'not known here', 'How far away you are and what your connection speaks. Round-trip time alone can expose a proxy.'],
  ];

  return (
    <section className="fp">
      <h2 className="sec-h">Your connection</h2>
      <ul className="facts">
        {rows.map(([name, value, why]) => (
          <li key={name}><span>{name}</span><span><b className="fp-v">{value}</b><br /><span className="muted">{why}</span></span></li>
        ))}
        <li><span>VPN check</span><span>{checks.map((c) => <span key={c} className="fp-v">{c}<br /></span>)}</span></li>
      </ul>
      <details className="hdrs">
        <summary>Every header your browser sent with this request ({me.headers?.length ?? 0}, cookies left out)</summary>
        <pre className="bid">{(me.headers ?? []).map(([k, v]) => `${k}: ${v}`).join('\n')}</pre>
      </details>
    </section>
  );
}
