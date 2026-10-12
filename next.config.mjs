/** @type {import('next').NextConfig} */
const nextConfig = {
  // Plain static files: no server, database or functions in production.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
