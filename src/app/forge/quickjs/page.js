import QuickJS from './QuickJS';
import './quickjs.css';

export const dynamic = 'force-static';

export const metadata = {
  title: 'QuickJS in WASM · The Forge · Jack Schliewe',
  description: 'A real JavaScript engine, run in your browser, with its memory numbers shown.',
};

export default function Page() {
  return (
    <main className="wrap qjs">
      <p className="back">$ forge --engine quickjs</p>
      <h1 className="qjs-h">A real engine</h1>
      <p className="lede">
        The wasm sandbox is the boundary. A guest bug is a wasm bug, not a page bug.
      </p>
      <p className="lede">
        setMemoryLimit does not prevent host OOM with the prebuilt wasm (upstream quickjs-emscripten issue #255).
      </p>
      <p className="lede">
        The engine downloads on your first Run. Programs get 2 seconds, then they are interrupted.
      </p>
      <QuickJS />
    </main>
  );
}
