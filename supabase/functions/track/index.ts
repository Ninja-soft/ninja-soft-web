import { classifySource, validateEvent } from "../_shared/analytics.ts";
import { clientIp, cors, sha256 } from "../_shared/http.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";

// Medición propia (sin cookies). Recibe beacons del sitio; el visitante se identifica con un hash
// diario de IP + navegador + secreto, que no permite recuperar la IP ni seguirlo entre días.
const db = adminClient();
let salt = "";

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
    const list = (Array.isArray(raw) ? raw : [raw]).slice(0, 20);
    if (!salt) salt = (await supabaseStore(db).secret("cron_secret")) ?? "ns";
    const day = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    const visitor = await sha256(`${clientIp(req)}|${req.headers.get("user-agent") ?? ""}|${day}|${salt}`);
    const rows = list
      .map(validateEvent)
      .filter((e) => e !== null)
      .map((e) => {
        const src = classifySource(e!.referrer, e!.utm, "soft.ninja");
        return {
          visitor: visitor.slice(0, 32),
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
