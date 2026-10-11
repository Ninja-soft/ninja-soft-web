// URL pública del sitio (dominio propio en Vercel desde el 2026-10-11).
// La usan canonical, sitemap y datos estructurados; NEXT_PUBLIC_SITE_URL la pisa si hace falta.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://soft.ninja").replace(/\/$/, "");
export const SITE_NAME = "Ninja Soft";
