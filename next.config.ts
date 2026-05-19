import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  // Next.js Fast Refresh needs 'unsafe-eval' in development.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `connect-src 'self' https://api.yookassa.ru https://api.resend.com https://*.supabase.co${
    isDev ? " ws: http://localhost:* http://127.0.0.1:*" : ""
  }`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/**" }]
      : [],
  },
  // typedRoutes moved out of experimental in Next.js 15.5+
  typedRoutes: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
