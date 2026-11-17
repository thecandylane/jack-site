import { pageMeta } from '@/lib/site';
import QuickJS from './QuickJS';
import './quickjs.css';

export const dynamic = 'force-static';

export const metadata = pageMeta({
  title: 'QuickJS in WASM · The Forge',
  description: 'A real JavaScript engine, run in your browser, with its memory numbers shown.',
  path: '/forge/quickjs',
});

export default function Page() {
  return (
    <main className="wrap qjs">
      <p className="back">$ forge --engine quickjs</p>
      <h1 className="qjs-h">A real engine</h1>
      <p className="lede">
        QuickJS, compiled to WebAssembly and run in your browser. It downloads on your first run, and a program gets
        2 seconds.
      </p>
      <QuickJS />
    </main>
  );
}
