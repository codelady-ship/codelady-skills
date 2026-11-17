import 'server-only';

// Simple per-IP limit for the single-instance case. Replace with KV/DB before heavy traffic.
const hits = new Map<string, number[]>();
const LIMIT = Number(process.env.RUN_LIMIT_PER_HOUR || 20);

export function clientIp(request: Request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

/** true when this IP may make one more request this hour (and counts it) */
export function allow(request: Request, bucket = 'run') {
  const key = `${bucket}:${clientIp(request)}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < 3600_000);
  if (recent.length >= LIMIT) return false;
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}
