/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sitio 100% estático: sin backend, se sirve desde el CDN de Vercel.
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
