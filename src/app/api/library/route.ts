import { LIBRARY } from '@/server/library';

/** The whole Library as one JSON file; the CDN keeps it for an hour, browsers check for a new version each time. */
export async function GET() {
  return Response.json(LIBRARY, { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400' } });
}
