import type { NextConfig } from "next";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.up.railway.app" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
    ],
  },
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
  async rewrites() {
    if (!/^https?:\/\//.test(API_BASE)) return [];
    // `:path*` captures what follows `/api/`, so the destination has to put the
    // prefix back. It used to forward `/api/v1/sales` to `${API_BASE}/v1/sales`,
    // and every route on the API lives under `/api/v1` -- so anything that took
    // this path got a 404 rather than reaching the endpoint.
    return [{ source: "/api/:path*", destination: `${API_BASE}/api/:path*` }];
  },
};

export default nextConfig;
