import { SUPABASE_URL } from "@/lib/supabase/client";

// Medición propia sin cookies: los eventos se juntan y se mandan con sendBeacon (no frena la navegación).
// La identificación del visitante la calcula el servidor (hash diario), acá sólo hay un id de pestaña.
type Event = { type: string; path: string; section?: string; value?: number; sid: string; w: number; referrer?: string; utm?: Record<string, string> };

const ENDPOINT = `${SUPABASE_URL}/functions/v1/track`;
let queue: Event[] = [];
let timer: number | undefined;

function sid(): string {
  try {
    let v = sessionStorage.getItem("ns-sid");
    if (!v) {
      v = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem("ns-sid", v);
    }
    return v;
  } catch {
    return "nosession";
  }
}

// En desarrollo (localhost / red local) no se mide, salvo con ?track=1, para no ensuciar las estadísticas.
function enabled(): boolean {
  const h = window.location.hostname;
  const local = h === "localhost" || h.startsWith("192.168.") || h.startsWith("127.");
  return !local || new URLSearchParams(window.location.search).has("track");
}

function flush() {
  if (!queue.length) return;
  const body = JSON.stringify(queue.splice(0, 20));
  try {
    if (!navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "text/plain" }))) {
      void fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } });
    }
  } catch {
    /* la medición nunca rompe la página */
  }
  if (queue.length) flush();
}

export function track(type: string, extra: { section?: string; value?: number; referrer?: string; utm?: Record<string, string> } = {}) {
  if (typeof window === "undefined" || !enabled()) return;
  queue.push({ type, path: window.location.pathname, sid: sid(), w: window.innerWidth, ...extra });
  window.clearTimeout(timer);
  timer = window.setTimeout(flush, 1500);
  if (type === "view") flush();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
}
