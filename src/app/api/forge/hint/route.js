import { LABS } from '@/lib/forge/index';

// Hints are public but handed out one at a time, so the editor can count how many were used.
// Nothing here is a secret: the proof of a solve is still the checker's state.
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const lab = LABS.find((l) => l.id === url.searchParams.get('lab'));
  const total = lab?.hints?.length ?? 0;
  const n = Math.max(1, Math.min(total || 1, Math.trunc(Number(url.searchParams.get('n')) || 1)));
  const hint = total ? lab.hints[n - 1] : null;
  return Response.json(
    { hint, n, total },
    { headers: { 'cache-control': 'no-store' } },
  );
}
