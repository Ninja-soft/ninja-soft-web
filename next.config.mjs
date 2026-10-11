/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sitio estático en el CDN de Vercel; el backend (chat/contacto) vive en Supabase Edge Functions.
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
