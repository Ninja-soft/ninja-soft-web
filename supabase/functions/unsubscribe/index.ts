import { cors } from "../_shared/http.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";

// Baja de campañas.
// GET  (link del email) → NO da de baja: lleva a /baja?t=… donde la persona confirma con un botón.
//      Así los antivirus y "Safe Links" que abren los links solos no dan de baja a nadie.
// POST (botón de /baja o el "one-click" de Gmail/Outlook vía List-Unsubscribe-Post) → da de baja.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = adminClient();
  const token = new URL(req.url).searchParams.get("t") ?? "";

  if (req.method === "GET") {
    const site = (await supabaseStore(db).settings()).site_url || "https://soft.ninja";
    const target = UUID.test(token) ? `/baja?t=${token}` : "/baja?error=1";
    return Response.redirect(`${site.replace(/\/$/, "")}${target}`, 302);
  }
  if (req.method !== "POST") return new Response(null, { status: 405, headers: cors });

  let ok = false;
  if (UUID.test(token)) {
    await db.from("contacts").update({ unsubscribed_at: new Date().toISOString() }).eq("unsub_token", token).is("unsubscribed_at", null);
    // Ya dado de baja también cuenta como "ok": la respuesta no revela nada distinto.
    const { data } = await db.from("contacts").select("id").eq("unsub_token", token).maybeSingle();
    ok = !!data;
  }
  return new Response(ok ? "ok" : "invalid", { status: ok ? 200 : 400, headers: cors });
});
