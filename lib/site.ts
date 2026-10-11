// URL pública del sitio. Cuando soft.ninja apunte a Vercel, definí NEXT_PUBLIC_SITE_URL=https://soft.ninja
// (canonical, sitemap y datos estructurados la usan).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ninja-soft-web.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "Ninja Soft";
