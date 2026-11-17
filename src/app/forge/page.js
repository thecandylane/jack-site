import { pageMeta } from '@/lib/site';
import Forge from './Forge';

export const dynamic = 'force-static';

export const metadata = pageMeta({
  title: 'The Forge',
  description: 'A small JavaScript engine you can run in the browser, with its heap laid out word by word.',
  path: '/forge',
});

export default function Page() {
  return (
    <main className="wrap">
      <p className="back">$ forge</p>
      <h1 className="you-h">The Forge</h1>
      <p className="lede">
        A JavaScript engine small enough to read, with three bugs left in on purpose. Pick a lab, write a program
        that reaches the bug, and the server hands back a flag. Nothing you run leaves the engine.
      </p>
      <p className="lede">
        Want a real engine? <a href="/forge/quickjs">QuickJS runs here too.</a>
      </p>
      <Forge />
    </main>
  );
}
