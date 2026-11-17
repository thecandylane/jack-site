import { getCloudflareContext } from '@opennextjs/cloudflare';

// The IP mirror on /you: what Cloudflare's edge already knows about each request (request.cf), handed back to the
// visitor who sent it. Nothing is logged or stored. Fields: developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties
export const dynamic = 'force-dynamic';

const FIELDS = ['asn', 'asOrganization', 'city', 'region', 'regionCode', 'metroCode', 'postalCode', 'country', 'continent', 'latitude', 'longitude', 'timezone', 'colo', 'httpProtocol', 'tlsVersion', 'tlsCipher', 'clientTcpRtt'];

export async function GET(request) {
  let cf = {};
  try { cf = getCloudflareContext().cf ?? {}; } catch {} // outside Cloudflare there is no cf object
  const ip = request.headers.get('cf-connecting-ip') || (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null;
  const out = { ip };
  for (const k of FIELDS) if (cf[k] !== undefined) out[k] = cf[k];
  out.headers = [...request.headers].filter(([k]) => !['cookie', 'authorization'].includes(k));
  return Response.json(out, { headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}
