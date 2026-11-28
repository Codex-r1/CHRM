/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";
const isPreview = process.env.VERCEL_ENV === "preview";

// Content Security Policy: only this site, Supabase (data, storage images) and Stripe
// (card form) may load scripts, frames or make requests. Vercel's preview toolbar is
// allowed on preview deployments only.
const vercelLive = isPreview ? " https://vercel.live https://*.vercel.live" : "";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://*.js.stripe.com${vercelLive}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com" + (isPreview ? " https://vercel.com https://vercel.live" : ""),
  "font-src 'self' data:" + (isPreview ? " https://vercel.live" : ""),
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.stripe.com${vercelLive}${isPreview ? " wss://ws-us3.pusher.com" : ""}`,
  `frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com${vercelLive}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self \"https://js.stripe.com\")" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig = {
  poweredByHeader: false,
  // Ignore ESLint errors during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript build errors
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // API responses are never cached by browsers or shared caches.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
module.exports = nextConfig;
