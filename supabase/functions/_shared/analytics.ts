// Medición propia de visitas (sin cookies): clasificación de fuente/dispositivo y validación de eventos.

export type Utm = { source?: string; medium?: string; campaign?: string; gclid?: string };
export type Source = { source: string; medium: string; campaign: string };

const SOCIAL: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.me$/, "Facebook"],
  [/(^|\.)t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, "X"],
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, "LinkedIn"],
  [/(^|\.)whatsapp\.com$|(^|\.)wa\.me$/, "WhatsApp"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "YouTube"],
];
const SEARCH: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)yahoo\.[a-z.]+$/, "Yahoo"],
];
const UTM_ALIASES: Record<string, string> = { ig: "Instagram", instagram: "Instagram", fb: "Facebook", facebook: "Facebook", google: "Google", whatsapp: "WhatsApp", wa: "WhatsApp" };

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export function classifySource(referrer: string, utm: Utm, siteHost: string): Source {
  const uSource = clip(utm.source, 80).toLowerCase();
  if (uSource) {
    return { source: UTM_ALIASES[uSource] ?? uSource, medium: clip(utm.medium, 80).toLowerCase() || "campaña", campaign: clip(utm.campaign, 80).toLowerCase() };
  }
  // Google Ads sin UTM: el clic trae gclid (auto-tagging).
  if (clip(utm.gclid, 200)) return { source: "Google", medium: "cpc", campaign: "" };
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    host = "";
  }
  const site = siteHost.replace(/^www\./, "").toLowerCase();
  const ownPreview = /^ninja-soft-web(-[a-z0-9-]+)?\.vercel\.app$/.test(host);
  if (!host || host === site || host.endsWith(`.${site}`) || ownPreview || host === "localhost") {
    return { source: "Directo", medium: "directo", campaign: "" };
  }
  for (const [re, name] of SEARCH) if (re.test(host)) return { source: name, medium: "orgánico", campaign: "" };
  for (const [re, name] of SOCIAL) if (re.test(host)) return { source: name, medium: "social", campaign: "" };
  return { source: host, medium: "referido", campaign: "" };
}

export function deviceType(width: number): "Celular" | "Tablet" | "Computadora" {
  if (!Number.isFinite(width) || width >= 1024) return "Computadora";
  return width < 640 ? "Celular" : "Tablet";
}

export const EVENT_TYPES = ["view", "section", "scroll", "cta", "chat_open", "chat_msg", "form_submit"] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export type TrackEvent = {
  type: EventType;
  path: string;
  section: string;
  value: number;
  sid: string;
  device: string;
  referrer: string;
  utm: Utm;
};

export function validateEvent(raw: unknown): TrackEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!EVENT_TYPES.includes(o.type as EventType)) return null;
  const path = clip(o.path, 200);
  if (!path.startsWith("/")) return null;
  const section = clip(o.section, 40);
  const value = Math.max(0, Math.min(100, Math.round(Number(o.value) || 0)));
  const utm = (o.utm && typeof o.utm === "object" ? o.utm : {}) as Utm;
  return {
    type: o.type as EventType,
    path,
    section: /^[a-z0-9-]*$/i.test(section) ? section.toLowerCase() : "",
    value,
    sid: clip(o.sid, 64),
    device: deviceType(Number(o.w)),
    referrer: clip(o.referrer, 300),
    utm: { source: clip(utm.source, 80), medium: clip(utm.medium, 80), campaign: clip(utm.campaign, 80), gclid: clip(utm.gclid, 200) },
  };
}
