import { SECURITY_HEADERS, CSP_DIRECTIVES } from '@/lib/security-headers';

// The same header data next.config.mjs sets, served as JSON. Nothing is computed per request, and the
// response is marked no-store so a cached copy never outlives a policy change.
export function GET() {
  return Response.json(
    { headers: SECURITY_HEADERS, csp: CSP_DIRECTIVES },
    { headers: { 'cache-control': 'no-store' } },
  );
}
