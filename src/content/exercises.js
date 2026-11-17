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

export const familiar = {
  title: 'tool.js · give the model a menu, not a command line',
  code: String.raw`
// A diagnostics tool built to hold: the model doesn't send a command,
// it picks a check by name, and the tool maps the name to a fixed
// argument list. The model's call is untrusted input, so check all of it.
const CHECKS = {
  uptime: ['uptime'],
  disk: ['df', '-h'],
  memory: ['free', '-m'],
  processes: ['ps'],
  user: ['whoami'],
};

// Returns the argv to run for a tool call, or null to refuse.
// This version still trusts too much. Make every test pass.
function checkCall(call) {
  if (call.name !== 'run_diagnostic') return null;
  return CHECKS[call.args.check] || null;
}

console.log(checkCall({ name: 'run_diagnostic', args: { check: 'disk' } }));
`,
  tests: String.raw`
const call = (args) => checkCall({ name: 'run_diagnostic', args });
test('uptime maps to its argv', () => eq(call({ check: 'uptime' }), ['uptime']));
test('disk maps to df -h', () => eq(call({ check: 'disk' }), ['df', '-h']));
test('an unknown check is refused', () => eq(call({ check: 'shell' }), null));
test('a command string is refused', () => eq(call({ check: 'disk; cat /etc/passwd' }), null));
test('a name inherited from Object is refused', () => eq(call({ check: 'constructor' }), null));
test('__proto__ is refused', () => eq(call({ check: '__proto__' }), null));
test('an extra argument is refused', () => eq(call({ check: 'disk', path: '/' }), null));
test('missing arguments are refused', () => eq(checkCall({ name: 'run_diagnostic' }), null));
test('a string instead of an object is refused', () => eq(call('disk'), null));
test('another tool is refused', () => eq(checkCall({ name: 'read_file', args: { check: 'disk' } }), null));
`,
};

export const fingerprintBits = {
  title: 'bits.js · how many signals make you unique',
  code: String.raw`
// Each signal you leak splits everyone into groups. If 1 browser in 8
// shares your value, that signal carries log2(8) = 3 bits about you.
// About 33 bits pick one person out of 8 billion (2 ** 33 is 8.6 billion).

// Write bits(share): the bits a value carries when a 'share' of all
// browsers (between 0 and 1) have it. Then total() adds them up.
// Adding assumes the signals are independent; real ones overlap a bit.
function bits(share) {
  return 0; // TODO
}

function total(signals) {
  return signals.reduce((sum, s) => sum + bits(s.share), 0);
}

// Made-up shares, for the example only.
const me = [
  { name: 'time zone', share: 1 / 20 },
  { name: 'language order', share: 1 / 30 },
  { name: 'screen size', share: 1 / 40 },
  { name: 'GPU model', share: 1 / 60 },
  { name: 'installed fonts', share: 1 / 500 },
  { name: 'canvas hash', share: 1 / 2000 },
];
for (const s of me) console.log(s.name.padEnd(16), bits(s.share).toFixed(1), 'bits');
console.log('total'.padEnd(16), total(me).toFixed(1), 'bits of about 33');
`,
  tests: String.raw`
const r = (x) => +x.toFixed(6);
test('half of everyone is 1 bit', () => eq(r(bits(1 / 2)), 1));
test('1 in 1,024 is 10 bits', () => eq(r(bits(1 / 1024)), 10));
test('a value everyone has carries 0 bits', () => eq(r(bits(1)), 0));
test('bits add up across signals', () => eq(r(total([{ share: 1 / 8 }, { share: 1 / 16 }])), 7));
`,
};

export const typing = {
  title: 'typing.js · your rhythm is a signature',
  code: String.raw`
// Keystroke dynamics. Dwell is how long each key is held (its keyup
// minus its keydown). Flight is the gap from releasing one key to
// pressing the next, in typing order. It goes negative when you roll
// keys: pressing the next one before letting go of the last.
// Times are in milliseconds, in the order the browser fired them.
const events = [
  { key: 't', type: 'down', t: 0 },
  { key: 't', type: 'up', t: 95 },
  { key: 'h', type: 'down', t: 160 },
  { key: 'e', type: 'down', t: 230 }, // pressed before h was released
  { key: 'h', type: 'up', t: 250 },
  { key: 'e', type: 'up', t: 310 },
];

// Return { dwell, flight }: dwell per key in the order keys were
// released, and flight for each press after the first, in press order.
function rhythm(events) {
  return { dwell: [], flight: [] }; // TODO
}

console.log(rhythm(events));
`,
  tests: String.raw`
test('dwell is keyup minus keydown, in release order', () => eq(rhythm(events).dwell, [95, 90, 80]));
test('flight is last release to next press', () => eq(rhythm(events).flight, [65, -20]));
test('a single key has a dwell and no flight', () => eq(rhythm([{ key: 'a', type: 'down', t: 10 }, { key: 'a', type: 'up', t: 70 }]), { dwell: [60], flight: [] }));
`,
};

export const pwned = {
  title: 'pwned.js · check a password without sending it',
  code: String.raw`
// Have I Been Pwned's range API never sees your password or its full
// hash. You send the first 5 hex characters of its SHA-1 and get back
// every leaked hash that starts with them, as "SUFFIX:COUNT" lines.
// With padding on, some lines are decoys with a count of 0.

// Given your full hash (40 hex characters, upper case) and the
// response text, return how many times your password was leaked.
function timesLeaked(hash, response) {
  return 0; // TODO
}

const hash = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8'; // SHA-1 of "password"
const response = [
  '1E2AAA439972480CEC7F16C795BBB429372:1',
  '1E4C9B93F3F0682250B6CF8331B7EE68FD8:52256179',
  '1E4C9B93F3F0682250B6CF8331B7EE68FD9:0',
].join('\r\n');
console.log('first 5 sent:', hash.slice(0, 5), '· leaked', timesLeaked(hash, response), 'times');
`,
  tests: String.raw`
test('finds the matching suffix', () => eq(timesLeaked(hash, response), 52256179));
test('a hash not in the response was never leaked', () => eq(timesLeaked('5BAA6' + '0'.repeat(35), response), 0));
test('a padding decoy counts as 0', () => eq(timesLeaked('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD9', response), 0));
test('a lower-case hash still matches', () => eq(timesLeaked(hash.toLowerCase(), response), 52256179));
`,
};

export const shellcodeFlag = {
  title: 'flag.js · a byte array is not an exploit',
  code: String.raw`
// ref-radar flagged 39 repos for "raw shellcode bytes", and 28 were
// harmless: test vectors, firmware, fonts. Bytes alone don't run.
// Shellcode needs memory it can execute, so a useful rule wants both:
// a long byte array, and a call that makes memory executable or runs
// code in another process, in the same file. And it should trust a
// file under tests/ or fixtures/ less.

// This version flags any long byte array. Make every test pass.
function flag(file) {
  return file.byteArrayLength >= 256;
}

console.log(flag({ path: 'src/loader.c', byteArrayLength: 512, text: 'VirtualAlloc(...PAGE_EXECUTE_READWRITE)' }));
console.log(flag({ path: 'fonts/glyphs.c', byteArrayLength: 4096, text: 'static const unsigned char glyphs[]' }));
`,
  tests: String.raw`
const f = (path, n, text) => flag({ path, byteArrayLength: n, text });
test('bytes plus VirtualAlloc with execute is flagged', () => eq(f('src/loader.c', 512, 'VirtualAlloc(0, n, MEM_COMMIT, PAGE_EXECUTE_READWRITE)'), true));
test('bytes plus mprotect PROT_EXEC is flagged', () => eq(f('src/run.c', 300, 'mprotect(p, n, PROT_READ | PROT_EXEC)'), true));
test('bytes plus CreateRemoteThread is flagged', () => eq(f('inject.cpp', 1024, 'CreateRemoteThread(h, 0, 0, addr, 0, 0, 0)'), true));
test('a font table is not flagged', () => eq(f('fonts/glyphs.c', 4096, 'static const unsigned char glyphs[]'), false));
test('a short array with exec memory is not flagged', () => eq(f('src/tiny.c', 32, 'mprotect(p, n, PROT_EXEC)'), false));
test('a test vector is not flagged, even next to mprotect', () => eq(f('tests/vectors/aes.c', 512, 'mprotect(p, n, PROT_EXEC)'), false));
test('a fixture folder counts as test data too', () => eq(f('crypto/fixtures/blob.h', 900, 'VirtualProtect(p, n, PAGE_EXECUTE_READ, &old)'), false));
`,
};
