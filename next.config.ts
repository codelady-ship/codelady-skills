import type { NextConfig } from "next";

// Static demo for GitHub Pages: `npm run build:demo` (scripts/build-demo.mjs) sets these.
const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(DEMO
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        ...(BASE_PATH ? { basePath: BASE_PATH } : {}),
      }
    : {}),
  // Server deploy (Cloudflare Workers): only the portfolio may frame the admin page.
  // A static export cannot send headers (GitHub Pages frames fine), so the demo build skips this.
  ...(DEMO
    ? {}
    : {
        async headers() {
          return [{
            source: '/:lang/admin',
            headers: [{ key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://antiqa-portfolio.vercel.app https://antiqacode.vercel.app" }],
          }];
        },
      }),
  // Partial prerendering needs a server, so the static demo turns it off.
  cacheComponents: !DEMO,
  partialPrefetching: !DEMO,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
