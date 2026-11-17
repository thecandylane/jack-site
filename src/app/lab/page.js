import { pageMeta } from '@/lib/site';
import NpmDiff from '@/components/NpmDiff';
import YaraPlayground from '@/components/YaraPlayground';
import AgentCheck from '@/components/AgentCheck';

export const metadata = pageMeta({
  title: 'Lab',
  description: 'Small security tools that run in your browser: an agent file checker, an npm release checker and a YARA-X rule playground.',
  path: '/lab',
});

export default function Lab() {
  return (
    <main className="wrap you">
      <p className="back">$ ls ~/lab</p>
      <h1 className="you-h">Lab</h1>
      <p className="lede">
        Small security tools that run in your browser. Nothing you type or pick is stored or sent anywhere, except the
        npm package name, which goes to the public npm registry. Each one comes from a post that explains it.
      </p>
      <section className="fp">
        <h2 className="sec-h">Agent file check</h2>
        <p className="lede">
          A repo can tell your coding agent what to do before you&apos;ve read a line of it. Paste its <code>CLAUDE.md</code>,{' '}
          <code>AGENTS.md</code>, <code>.claude/settings.json</code>, <code>.mcp.json</code> or <code>.vscode/tasks.json</code> to see
          the hooks, MCP servers, hidden text and shell commands inside. From{' '}
          <a href="/blog/what-194-flagged-repos-look-like">What 194 flagged repos look like</a>.
        </p>
        <AgentCheck />
      </section>
      <section className="fp">
        <h2 className="sec-h">npm diff guard</h2>
        <p className="lede">
          Compares a package&apos;s newest release with the one before it and flags what Shai-Hulud changed in every wave:
          new install hooks, native builds, git dependencies, new commands, a different publisher, lost provenance or a
          jump in size. From <a href="/blog/shai-hulud-ten-waves">Shai-Hulud: ten waves, one shape</a>.
        </p>
        <NpmDiff />
      </section>
      <section className="fp">
        <h2 className="sec-h">YARA-X playground</h2>
        <p className="lede">
          VirusTotal&apos;s rule engine, compiled to WebAssembly. The starter rules catch the structure the later waves left
          in repos. Edit them, scan the samples, or scan a file of your own; it never leaves your browser.
        </p>
        <YaraPlayground />
      </section>
    </main>
  );
}
