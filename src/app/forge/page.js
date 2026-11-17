import Forge from './Forge';

export const dynamic = 'force-static';

export const metadata = {
  title: 'The Forge · Jack Schliewe',
  description: 'A small JavaScript engine you can run in the browser, with its heap laid out word by word.',
};

export default function Page() {
  return (
    <main className="wrap">
      <p className="back">$ forge</p>
      <h1 className="you-h">The Forge</h1>
      <p className="lede">
        A JavaScript engine small enough to read: 4-byte tagged words, a 16-byte object header, doubles kept in their
        own HeapNumbers, and one flat cage. It runs here in your tab. Nothing it runs can reach this page, the network,
        or a real command: the host is a table of values and every crossing is logged.
      </p>
      <p className="lede">
        <a href="/forge/quickjs">/forge/quickjs</a> runs a real engine, QuickJS in WASM, so the model above can be
        compared against one that has a parser, a compiler and a garbage collector.
      </p>
      <Forge />
    </main>
  );
}
