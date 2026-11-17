import 'server-only';

/** Only same-site paths like "/az/market" (no "//evil.com", no full URLs) may be used after sign-in. */
export function safeNext(v: string | null | undefined) {
  const s = String(v || '');
  return /^\/(?![/\\])[\w\-./#?=&%]*$/.test(s) ? s : '/';
}
