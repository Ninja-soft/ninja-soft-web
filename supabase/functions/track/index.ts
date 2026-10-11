import { classifySource, validateEvent } from "../_shared/analytics.ts";
import { clientIp, cors, sha256 } from "../_shared/http.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";

// Medición propia (sin cookies). Recibe beacons del sitio; el visitante se identifica con un hash
// diario de IP + navegador + sal secreta, que no permite recuperar la IP ni seguirlo entre días.
const db = adminClient();
const store = supabaseStore(db);
let salt = "";
const LIMIT = { requests: 120, windowMs: 10 * 60_000 }; // por visitante: frena scripts que inflan las estadísticas

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: cors });
  try {
    const text = await req.text();
    if (text.length > 4000) return new Response(null, { status: 413, headers: cors });
    let raw: unknown = null;
    try {
      raw = JSON.parse(text);
    } catch {
      return new Response(null, { status: 400, headers: cors });
    }
    if (!salt) {
      const s = await store.secret("analytics_salt");
      if (!s) return new Response(null, { status: 204, headers: cors }); // sin sal no se mide (nunca un hash débil)
      salt = s;
    }
    const day = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    const visitor = (await sha256(`${clientIp(req)}|${req.headers.get("user-agent") ?? ""}|${day}|${salt}`)).slice(0, 32);

    const bucket = `track:${visitor}`;
    if ((await store.countRecent(bucket, LIMIT.windowMs)) >= LIMIT.requests) return new Response(null, { status: 429, headers: cors });
    await store.hit(bucket);

    const list = (Array.isArray(raw) ? raw : [raw]).slice(0, 20);
    const rows = list
      .map(validateEvent)
      .filter((e) => e !== null)
      .map((e) => {
        const src = classifySource(e!.referrer, e!.utm, "soft.ninja");
        return {
          visitor,
          sid: e!.sid,
          type: e!.type,
          path: e!.path,
          section: e!.section,
          value: e!.value,
          source: src.source,
          medium: src.medium,
          campaign: src.campaign,
          device: e!.device,
        };
      });
    if (rows.length) await db.from("page_events").insert(rows);
    return new Response(null, { status: 204, headers: cors });
  } catch (err) {
    console.error("track", err);
    return new Response(null, { status: 204, headers: cors });
  }
});
