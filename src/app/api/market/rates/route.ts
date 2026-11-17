import { detectCurrency } from '@/lib/market/price';
import { getRates } from '@/server/market/rates';

/**
 * USD exchange rates (cached daily) and the currency this visitor most likely uses:
 * Cloudflare's cf-ipcountry header first, then Accept-Language.
 */
export async function GET(request: Request) {
  const table = await getRates();
  const suggested = detectCurrency(request.headers.get('cf-ipcountry'), request.headers.get('accept-language'));
  return Response.json(
    { suggested, rates: table.rates, updated: table.updated, source: table.source },
    { headers: { 'Cache-Control': 'private, max-age=3600' } },
  );
}
