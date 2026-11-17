import { publicConfig } from '@/server/market/config';
import { getUser } from '@/server/market/session';
import { ok } from '@/server/market/http';

/** Who is signed in (null if nobody) and which sign-in / payment mode the site runs in. */
export async function GET() {
  const user = await getUser().catch(() => null);
  return ok({ user, config: publicConfig() });
}
