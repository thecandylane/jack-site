// Fix-the-bug exercises for <Playground/> in posts: { title, code, tests }. Each starter has the bug the post
// describes; the tests pass once it is fixed. exercises.test.mjs checks both, with a reference fix kept out of
// the site. Code is String.raw so backslashes reach the editor as written.

export const forge = {
  title: 'forge.js · keep the copy inside the buffer',
  code: String.raw`
// A 40-byte stack frame, laid out like the diagram above:
// buf is bytes 0-15, the canary 16-23, the saved frame pointer 24-31
// and the return address 32-39.
const BUF = 16;

// Copies the input into buf. Like gets() or strcpy(), it never asks
// how big buf is. Fix it so no input can touch anything past byte 15.
function copyInput(stack, input) {
  for (let i = 0; i < input.length; i++) stack[i] = input.charCodeAt(i);
}

// Watch a long input run into the canary (16-23) and return address (32-39).
const stack = new Uint8Array(40).fill(0xaa);
copyInput(stack, 'A'.repeat(36));
console.log([...stack].map((b) => b.toString(16).padStart(2, '0')).join(' '));
`,
  tests: String.raw`
const frame = () => new Uint8Array(40).fill(0xaa);
test('a short input is copied', () => { const s = frame(); copyInput(s, 'hi'); eq([s[0], s[1]], [104, 105]); });
test('16 bytes fill buf exactly', () => { const s = frame(); copyInput(s, 'B'.repeat(16)); eq([s[15], s[16]], [66, 0xaa]); });
test('a long input leaves the canary alone', () => { const s = frame(); copyInput(s, 'A'.repeat(100)); eq([...s.slice(16, 24)], Array(8).fill(0xaa)); });
test('a long input leaves the return address alone', () => { const s = frame(); copyInput(s, 'A'.repeat(100)); eq([...s.slice(32, 40)], Array(8).fill(0xaa)); });
`,
};

export const ashen = {
  title: 'hostname.js · allow what a hostname can be',
  code: String.raw`
// The real fix is to run ping with an argument list and no shell.
// Checking the input is the second layer, and it only works as an
// allowlist: accept what a hostname can be, rather than blocking
// the characters you happened to think of.

// This blocklist misses plenty. Replace it with an allowlist.
function isHostname(s) {
  return !s.includes(';');
}

console.log(isHostname('example.com'), isHostname('example.com; id'));
`,
  tests: String.raw`
test('accepts example.com', () => eq(isHostname('example.com'), true));
test('accepts a subdomain with a dash', () => eq(isHostname('status-01.lab.example.org'), true));
test('accepts an IPv4 address', () => eq(isHostname('10.0.0.1'), true));
test('rejects a second command after ;', () => eq(isHostname('example.com; id'), false));
test('rejects &&', () => eq(isHostname('example.com && id'), false));
test('rejects a pipe', () => eq(isHostname('example.com | id'), false));
test('rejects $( )', () => eq(isHostname('$(id).example.com'), false));
test('rejects a newline', () => eq(isHostname('example.com\nid'), false));
test('rejects an option like -f', () => eq(isHostname('-f'), false));
test('rejects an empty string', () => eq(isHostname(''), false));
`,
};

export const warCamp = {
  title: 'restore.js · keep every entry inside the folder',
  code: String.raw`
// The restore feature wrote each archive entry to root + '/' + entry.
// Make safeJoin return the full path only when it stays inside root,
// and null otherwise. There's no path module here, so resolve '.'
// and '..' yourself.

function safeJoin(root, entry) {
  if (entry.startsWith('../')) return null; // the obvious case
  return root + '/' + entry;
}

console.log(safeJoin('/srv/restore', 'notes/a.txt'));
console.log(safeJoin('/srv/restore', 'notes/../../etc/cron.d/x'));
`,
  tests: String.raw`
const R = '/srv/restore';
test('a plain entry lands inside', () => eq(safeJoin(R, 'notes/a.txt'), '/srv/restore/notes/a.txt'));
test('./ is resolved', () => eq(safeJoin(R, './a.txt'), '/srv/restore/a.txt'));
test('.. that stays inside is resolved', () => eq(safeJoin(R, 'notes/../a.txt'), '/srv/restore/a.txt'));
test('.. that climbs out is refused', () => eq(safeJoin(R, 'notes/../../etc/x'), null));
test('a bare .. is refused', () => eq(safeJoin(R, '..'), null));
test('an absolute path is refused', () => eq(safeJoin(R, '/etc/passwd'), null));
test('Windows separators are refused', () => eq(safeJoin(R, '..\\..\\x'), null));
`,
};

export const kingsSeal = {
  title: 'verify.js · the server picks the algorithm and key',
  code: String.raw`
// A toy token: { header, payload, sig }. sign() stands in for HMAC.
const sign = (key, data) => 'sig(' + key + ':' + data + ')';
const KEYS = { k1: 'server-secret' }; // the only keys this server trusts

// This verifier lets the token's own header choose the algorithm and
// the key. Change it so the server decides both: HS256 only, and only
// keys from KEYS.
function verify(token) {
  const { alg, kid, jwk } = token.header;
  if (alg === 'none') return true;
  const key = jwk ?? KEYS[kid];
  return token.sig === sign(key, JSON.stringify(token.payload));
}
`,
  tests: String.raw`
const tok = (header, payload, key) => ({ header, payload, sig: key === undefined ? '' : sign(key, JSON.stringify(payload)) });
const admin = { sub: 'jack', role: 'admin' };
test('a real token passes', () => eq(verify(tok({ alg: 'HS256', kid: 'k1' }, admin, 'server-secret')), true));
test('a tampered payload fails', () => { const t = tok({ alg: 'HS256', kid: 'k1' }, admin, 'server-secret'); t.payload = { sub: 'eve', role: 'admin' }; eq(verify(t), false); });
test('alg none fails', () => eq(verify(tok({ alg: 'none' }, admin)), false));
test('a key carried in the header fails', () => eq(verify(tok({ alg: 'HS256', jwk: 'my-key' }, admin, 'my-key')), false));
test('an unknown kid fails', () => eq(verify(tok({ alg: 'HS256', kid: 'k9' }, admin, 'undefined')), false));
test('an unexpected alg fails', () => eq(verify(tok({ alg: 'HS512', kid: 'k1' }, admin, 'server-secret')), false));
`,
};

export const bindingCircle = {
  title: 'tool.js · check the whole command',
  code: String.raw`
// The agent's diagnostics tool approved a command when its first word
// was on the list. The model can be talked into sending anything, so
// the tool has to hold the line. Let through only these exact commands.
const SAFE = ['uptime', 'df -h', 'free -m', 'whoami'];

function allowed(cmd) {
  return SAFE.some((s) => cmd.split(' ')[0] === s.split(' ')[0]);
}

console.log(allowed('uptime'), allowed('uptime; cat notes.txt'));
`,
  tests: String.raw`
test('uptime is allowed', () => eq(allowed('uptime'), true));
test('df -h is allowed', () => eq(allowed('df -h'), true));
test('a second command after ; is refused', () => eq(allowed('uptime; cat notes.txt'), false));
test('&& is refused', () => eq(allowed('whoami && cat notes.txt'), false));
test('a pipe is refused', () => eq(allowed('whoami | tee out.txt'), false));
test('a newline is refused', () => eq(allowed('uptime\ncat notes.txt'), false));
test('$( ) is refused', () => eq(allowed('df -h $(cat notes.txt)'), false));
test('arguments not on the list are refused', () => eq(allowed('df /'), false));
`,
};

export const safeName = {
  title: 'safename.js · never print a name as-is',
  code: String.raw`
// A file name can hold escape sequences that clear or rewrite your
// terminal when printed. Make safeName turn every byte outside
// printable ASCII (0x20-0x7e), and the backslash itself, into \xNN.
// Work on UTF-8 bytes: TextEncoder gives you them.

function safeName(name) {
  return name;
}

console.log(safeName('report\x1b[2J.txt'));
`,
  tests: String.raw`
test('a plain name is unchanged', () => eq(safeName('package.json'), 'package.json'));
test('ESC is escaped', () => eq(safeName('a\x1b[2Jb'), 'a\\x1b[2Jb'));
test('a newline is escaped', () => eq(safeName('a\nb'), 'a\\x0ab'));
test('a backslash is escaped', () => eq(safeName('a\\b'), 'a\\x5cb'));
test('non-ASCII is escaped as UTF-8 bytes', () => eq(safeName('café'), 'caf\\xc3\\xa9'));
`,
};

export const entropy = {
  title: 'entropy.js · spot the packed payload',
  code: String.raw`
// The defanger flags files whose bytes look random: packed or
// encrypted payloads hiding as .txt. Shannon entropy measures it, in
// bits per byte: English text sits near 4 to 5, random data near 8.
function entropy(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const counts = new Array(256).fill(0);
  for (const b of bytes) counts[b]++;
  let bits = 0;
  for (const c of counts) if (c) { const p = c / bytes.length; bits -= p * Math.log2(p); }
  return bits;
}

// Paste anything in and run it.
const samples = {
  readme: 'Run npm install, then npm test. The tests cover the parser and the CLI.',
  base64: 'H4sIAAAAAAAAA+1YbW/bNhD2Z/0KQp8rKZL1Yt9gTMJ0w9DXbRj6oSNIUbYdYo4sZeyiH7PV',
  random: crypto.getRandomValues(new Uint8Array(4096)),
};
for (const [name, data] of Object.entries(samples)) console.log(name.padEnd(8), entropy(data).toFixed(2), 'bits/byte');
`,
  tests: '',
};
