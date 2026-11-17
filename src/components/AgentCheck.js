'use client';

import { useState } from 'react';
import { check, SAMPLES } from '@/lib/agentcheck';

// Paste a file an agent or editor acts on and see what it would make the tool do. Text checks only, in the
// browser: nothing is run, fetched or sent.
const MARK = { high: '✗', warn: '!', info: '·' };
const CLS = { high: 'no', warn: 'warn', info: 'ok' };

export default function AgentCheck() {
  const names = Object.keys(SAMPLES);
  const [pick, setPick] = useState(names[0]);
  const [text, setText] = useState(SAMPLES[names[0]]);
  const [res, setRes] = useState(null);
  const choose = (n) => { setPick(n); setText(SAMPLES[n]); setRes(null); };
  const high = res?.findings.filter((f) => f.level === 'high').length ?? 0;

  return (
    <figure className="play tool">
      <figcaption>
        <span>agent file check · what would this make your agent do?</span>
        <span className="play-btns"><button type="button" className="go" onClick={() => setRes(check(text))}>check ▸</button></span>
      </figcaption>
      <div className="tool-form">
        <select value={pick} onChange={(e) => choose(e.target.value)} aria-label="sample">
          {names.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <textarea className="yara-in" value={text} onChange={(e) => { setText(e.target.value); setRes(null); }} spellCheck="false" rows={12}
        aria-label="CLAUDE.md, AGENTS.md, .claude/settings.json, .mcp.json or .vscode/tasks.json" />
      {res && (
        <div className="play-out" role="status">
          <p className={high ? 'fail' : 'pass'}>
            {res.findings.length === 0 ? 'Nothing here runs a command, hides text or reaches outside the repo.' : high ? `${high} red flag${high > 1 ? 's' : ''}. Read these before you open the repo with an agent.` : 'No red flags. Worth knowing:'}
          </p>
          {res.findings.map((f, i) => <p key={i} className={CLS[f.level]}>{MARK[f.level]} {f.text}</p>)}
        </div>
      )}
    </figure>
  );
}
