// Voice API (TTS, accounts, limits, billing) from the Codelady Səs project, mounted as-is.
// Source: voice-site/server (copied into src/server/voice). Routes: /api/tts, /api/config, …
import { handle } from '@/server/voice/app.js';

const run = (request: Request) => handle(request, process.env);

export const GET = run;
export const POST = run;
export const DELETE = run;
export const OPTIONS = run;
