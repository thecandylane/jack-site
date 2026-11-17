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
        own HeapNumbers, and one flat cage of 65,536 bytes. The judge runs on the server — your program is parsed and
        walked by this engine in the Worker, and the flag comes back only when the lab&apos;s checker finds the evidence
        in the heap or the host log. Nothing a program does can reach this page, the network, or a real command.
      </p>
      <p className="lede">
        Three labs, each a bug left in the engine on purpose: a merge without a <code>__proto__</code> guard, an array
        length that never resizes its block, and a view whose handle index lives in reachable memory.
      </p>
      <p className="lede">
        <a href="/forge/quickjs">/forge/quickjs</a> runs a real engine, QuickJS in WASM, so the model above can be
        compared against one that has a parser, a compiler and a garbage collector.
      </p>
      <Forge />
    </main>
  );
}
