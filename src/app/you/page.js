import Fingerprint from '@/components/Fingerprint';
import IpMirror from '@/components/IpMirror';

export const metadata = {
  title: 'What you bring with you · Jack Schliewe',
  description: 'What your connection and your browser tell every site you visit. Nothing is stored.',
};

const RADAR = 'https://ref.lookit.space';

export default function You() {
  return (
    <main className="wrap you">
      <p className="back">$ whoami --everything</p>
      <h1 className="you-h">What you bring with you</h1>
      <p className="lede">
        Every site you open can read the values below without asking. Together they often single out one browser among
        millions, with no cookie at all. This page shows you what they see. It stores nothing, and this site has no
        analytics.
      </p>
      <p className="lede">
        The first part is what the server learned from your connection alone. The rest is read in your browser and never
        leaves it.
      </p>
      <IpMirror />
      <Fingerprint />
      <section className="fp">
        <h2 className="sec-h">Read more</h2>
        <ul className="facts">
          <li><span>Browser Nerds</span><a href="https://browsernerds.com/">browsernerds.com: a dictionary of fingerprinting signals, each with its own test</a></li>
          <li><span>ref-radar</span><a href={`${RADAR}/search?q=browser+fingerprinting`}>Who already built fingerprinting and anti-fingerprinting code</a></li>
          <li><span>EFF Cover Your Tracks</span><a href="https://coveryourtracks.eff.org/">coveryourtracks.eff.org: how unique your browser is against EFF&apos;s visitors</a></li>
        </ul>
      </section>
    </main>
  );
}
