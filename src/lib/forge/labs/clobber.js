// Lab D: the client-side one. The sanitizer reads the bytes once; the browser reads them again.
// Judged from state (window.config.mode in the model), never from a string comparison.

import { evaluate } from '../html.js';

export const CLOBBER_LAB = {
  id: 'clobber',
  title: 'Two documents, the same bytes',
  kind: 'html',
  language: 'html',
  seed: `<a id="config" mode="evil">\n`,
  brief: [
    'A page lets you post HTML. Its sanitizer parses your bytes, strips id and name (they clobber window properties), and rejects script, on* handlers and javascript: URLs.',
    'Then the browser parses the result again. Those two parses do not always agree. The sink reads window.config.mode; if it is "evil", the page takes the wrong branch.',
    'Goal: get mode="evil" onto window.config without the sanitizer refusing the payload.',
  ].join('\n'),
  hints: [
    'The first pass removes id and name from every tag it actually parses. Watch the log: it tells you what it stripped.',
    'Some containers are copied through as text, so their tags are never parsed by the first pass. The browser reparses foreign content.',
    'Put <a id="config" mode="evil"> inside an <svg> block. The first pass sees text; the second sees an element with an id.',
  ],
  start() {},

  evaluate(source, forge, defended = false) {
    const result = evaluate(source, { strict: defended });
    forge.htmlState = result;
    if (result.blocked) return { ok: false, error: 'the sanitizer refused the payload', log: result.log };
    return { ok: true, log: result.log, error: null };
  },

  fix: {
    title: 'Parse the document the way the parser does',
    note: 'One parser, used by both the sanitizer and the DOM. If foreign content is reparsed by the browser, the sanitizer must reparse it too — and a sink should never read a named property off window.',
    code: `sanitize(html, { strict: true });  // parse <svg> content too
// and read configuration from a frozen, own property, not window.config`,
  },

  check(forge) {
    const state = forge.htmlState;
    if (state?.solved) {
      return { solved: true, why: 'the sink read mode=evil from a window property the sanitizer never saw' };
    }
    if (state?.blocked) return { solved: false, why: 'the sanitizer refused the payload' };
    return { solved: false, why: 'window.config.mode is not evil' };
  },
};
