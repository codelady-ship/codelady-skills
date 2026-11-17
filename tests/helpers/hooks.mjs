// Lets Node run the site's TypeScript directly (tests and scripts/check-i18n.ts), with no extra package:
//   - "server-only" becomes an empty module (it only guards against browser bundles);
//   - "@/x" resolves to src/x, as in tsconfig.json;
//   - extensionless relative imports get ".ts", ".tsx" or "/index.ts";
//   - package subpaths without an exports map (e.g. "next/headers") get ".js".
// Node 23.6+ strips the types itself. Use: node --import ./tests/helpers/hooks.mjs <file.ts>
import { registerHooks } from 'node:module';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = new URL('../../src/', import.meta.url);
const isFile = (p) => existsSync(p) && statSync(p).isFile();

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
    if (context.parentURL?.includes('/node_modules/')) return next(specifier, context); // packages resolve as usual
    let spec = specifier;
    if (spec.startsWith('@/')) spec = new URL(spec.slice(2), SRC).href;
    const relative = spec.startsWith('./') || spec.startsWith('../');
    if ((relative && context.parentURL?.startsWith('file:')) || spec.startsWith('file:')) {
      const base = fileURLToPath(relative ? new URL(spec, context.parentURL) : new URL(spec));
      if (!isFile(base)) {
        for (const ext of ['.ts', '.tsx', '/index.ts']) {
          if (isFile(base + ext)) return next(pathToFileURL(base + ext).href, context);
        }
      }
      return next(pathToFileURL(base).href, context);
    }
    try {
      return next(spec, context);
    } catch (e) {
      if (e?.code !== 'ERR_MODULE_NOT_FOUND' || !/^[@\w][^:]*\/[^.]+$/.test(spec)) throw e;
      return next(spec + '.js', context);
    }
  },
});
