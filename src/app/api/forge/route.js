import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createForge, labById, LABS } from '@/lib/forge/index';
import { parse } from '@/lib/forge/parser';

// The Forge's judge. The VM is an interpreter, not eval, so it runs here: the Cage, the bugs and
// the host table all live in the Worker, and the flag only leaves when the lab's checker says so.
// The client never holds the flag and never decides whether a solve happened.
export const dynamic = 'force-dynamic';

const HEAP_BYTES = 1 << 16;
const MAX_STEPS = 400_000;
const MAX_SOURCE = 4000;
const MAX_BLOCKS = 80;

function cf() {
  try {
    return getCloudflareContext().env;
  } catch {
    return {}; // next start / next dev, without bindings
  }
}

const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

export async function GET() {
  return json({ labs: LABS.map(({ id, title, brief }) => ({ id, title, brief })) });
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const lab = labById(body?.lab) ?? labById('pollution');
  const defend = body?.defend === true;
  const source = typeof body?.source === 'string' ? body.source : '';
  if (!source.trim()) return json({ error: 'Nothing to run.' }, 400);
  if (source.length > MAX_SOURCE) return json({ error: `Keep the program under ${MAX_SOURCE} characters.` }, 400);

  const env = { ...process.env, ...cf() };
  const ip = request.headers.get('cf-connecting-ip') || (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  if (env.FORGE_PER_IP && !(await env.FORGE_PER_IP.limit({ key: ip })).success) {
    return json({ error: 'The forge is hot. Try again in a minute.' }, 429);
  }

  // One secret per lab, falling back to the shared one: FORGE_FLAG_POLLUTION, FORGE_FLAG_BOUNDS,
  // FORGE_FLAG_ESCAPE, then FORGE_FLAG. A lab with no flag still scores; it returns null.
  const flag = env[`FORGE_FLAG_${lab.id.toUpperCase()}`] || env.FORGE_FLAG || '';

  const execute = (defended) => {
    const forge = createForge({ heapBytes: HEAP_BYTES, steps: MAX_STEPS, parse, flag, lab, defend: defended });
    const out = forge.run(source);
    return { forge, out, verdict: lab.check(forge) };
  };

  const { forge, out, verdict } = execute(defend);

  // A solve is only interesting next to the same source hitting the fix. Run it once more with
  // the patches on, and report what happened — never a second flag.
  let after = null;
  if (verdict.solved && !defend) {
    const fixed = execute(true);
    after = {
      ok: fixed.out.ok,
      log: fixed.out.log.slice(-20),
      error: fixed.out.error ?? null,
      solved: fixed.verdict.solved,
      why: fixed.verdict.why,
    };
  }

  return json({
    ok: out.ok,
    log: out.log.slice(-100),
    error: out.error ?? null,
    steps: out.steps,
    used: forge.used(),
    heapBytes: HEAP_BYTES,
    objects: forge.objects().slice(0, MAX_BLOCKS).map((o) => ({
      offset: o.offset,
      size: o.size,
      kind: forge.maps.get(o.mapId)?.kind ?? 'freed',
    })),
    defended: defend,
    solved: verdict.solved,
    why: verdict.why,
    flag: verdict.solved && !defend && flag ? flag : null,
    fix: verdict.solved ? lab.fix ?? null : null,
    after,
  });
}
