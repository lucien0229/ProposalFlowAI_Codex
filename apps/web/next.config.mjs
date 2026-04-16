const isNextLint = process.argv.includes("lint");

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  (process.env.NODE_ENV === "production" && !isNextLint
    ? (() => {
        throw new Error("NEXT_PUBLIC_API_BASE_URL or API_BASE_URL is required for production builds.");
      })()
    : "http://127.0.0.1:8000");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
