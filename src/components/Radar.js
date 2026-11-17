// ref-radar's radar (or universe) view, embedded with the given refs lit: <Radar lit={['gh:owner/repo']} />.
// Needs ref.lookit.space to allow this site as a frame ancestor (ref-radar's _headers).
export default function Radar({ lit = [], focus, view = 'radar' }) {
  const q = new URLSearchParams({ embed: '1' });
  if (lit.length) q.set('lit', lit.join(','));
  if (focus) q.set('focus', focus);
  return (
    <iframe
      className="radar"
      src={`https://ref.lookit.space/${view === 'universe' ? 'universe' : 'radar'}?${q}`}
      title="ref-radar: the refs this post cites"
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
    />
  );
}
