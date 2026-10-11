import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";

// Baja de campañas. GET desde el link del email → baja y redirige a la página /baja del sitio.
// POST = "one-click" de Gmail/Outlook (List-Unsubscribe-Post) → baja y 200.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const db = adminClient();
  const token = new URL(req.url).searchParams.get("t") ?? "";
  let ok = false;
  if (UUID.test(token)) {
    const { data } = await db
      .from("contacts")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("unsub_token", token)
      .is("unsubscribed_at", null)
      .select("id");
    // Si ya estaba dado de baja, también es "ok": no revelamos nada distinto.
    if (data?.length) ok = true;
    else {
      const { data: prev } = await db.from("contacts").select("id").eq("unsub_token", token).maybeSingle();
      ok = !!prev;
    }
  }
  if (req.method === "POST") return new Response(ok ? "ok" : "invalid", { status: ok ? 200 : 400 });
  const site = (await supabaseStore(db).settings()).site_url || "https://soft.ninja";
  return Response.redirect(`${site.replace(/\/$/, "")}/baja?${ok ? "ok=1" : "error=1"}`, 302);
});
