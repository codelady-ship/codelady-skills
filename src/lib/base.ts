// Static demo build (GitHub Pages): the site lives under a sub-path and has no server.
// Both values are inlined at build time; in the normal build they are '' and false.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === '1';

/** Prefixes a public/ file path ('/voice/data.js') with the base path. Next's <Link> does this by itself. */
export const withBase = (path: string) => `${BASE_PATH}${path}`;

/** For location.assign(): adds the base path unless the path already has it. */
export const browserPath = (path: string) =>
  BASE_PATH && !(path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) ? withBase(path) : path;
