import { renderCampaign } from "../_shared/campaign.ts";
import { bearer, cors, json } from "../_shared/http.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";
import { brandVars } from "../_shared/template.ts";
import { obj } from "../_shared/validate.ts";

// Campañas por email (sólo admins). El panel crea la campaña y la envía por lotes de 100
// llamando a send_batch hasta que no queden pendientes; si se corta, se reanuda sin duplicar.
const BATCH = 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });
  try {
    const db = adminClient();
    const { data: u } = await db.auth.getUser(bearer(req));
    if (!u.user) return json(401, { error: "Iniciá sesión de nuevo." });
    const { data: adm } = await db.from("internal_admins").select("user_id").eq("user_id", u.user.id).maybeSingle();
    if (!adm) return json(403, { error: "Sin acceso." });

    const body = obj(await req.json().catch(() => null));
    const store = supabaseStore(db);
    const s = await store.settings();
    const key = await store.secret("resend_api_key");
    if (!key || !s.sender) return json(400, { error: "Configurá Resend (API key y remitente) primero." });
    const brand = brandVars(s);
    const unsubBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1/unsubscribe?t=`;
    const emailOf = (to: string, subject: string, html: string, token: string | null) => ({
      from: s.sender,
      to: [to],
      subject,
      html,
      ...(token
        ? { headers: { "List-Unsubscribe": `<${unsubBase}${token}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }
        : {}),
    });
    const resendBatch = async (emails: unknown[]) => {
      const r = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(emails),
      });
      if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
    };

    const subject = String(body.subject ?? "").trim();
    const html = String(body.html ?? "");
    switch (String(body.action ?? "")) {
      case "test": {
        if (!subject || !html) return json(400, { error: "Completá asunto y contenido." });
        const msg = renderCampaign(subject, html, { name: "Lucas", email: u.user.email ?? "" }, "#baja-de-prueba", brand);
        await resendBatch([emailOf(u.user.email ?? "", `[Prueba] ${msg.subject}`, msg.html, null)]);
        return json(200, { ok: true, to: u.user.email });
      }
      case "start": {
        if (!subject || !html) return json(400, { error: "Completá asunto y contenido." });
        const { data: list, error } = await db.from("contacts").select("id").is("unsubscribed_at", null);
        if (error) throw new Error(error.message);
        if (!list?.length) return json(400, { error: "No hay contactos suscriptos." });
        // Si viene de un borrador, se convierte en el envío (no se duplica en el historial).
        const draftId = typeof body.draft_id === "string" ? body.draft_id : "";
        const q = draftId
          ? db.from("campaigns").update({ subject, html, status: "sending", total: list.length, created_at: new Date().toISOString() }).eq("id", draftId).eq("status", "draft")
          : db.from("campaigns").insert({ subject, html, total: list.length, created_by: u.user.id });
        const { data: c, error: cerr } = await q.select("id,total").single();
        if (cerr) throw new Error(cerr.message);
        const { error: rerr } = await db.from("campaign_recipients").insert(list.map((x) => ({ campaign_id: c.id, contact_id: x.id })));
        if (rerr) throw new Error(rerr.message);
        return json(200, { id: c.id, total: c.total });
      }
      case "send_batch": {
        const id = String(body.id ?? "");
        const { data: camp } = await db.from("campaigns").select("id,subject,html,status").eq("id", id).maybeSingle();
        if (!camp) return json(404, { error: "Campaña inexistente." });
        const { data: pend, error } = await db
          .from("campaign_recipients")
          .select("contact_id, contacts(email,name,unsub_token,unsubscribed_at)")
          .eq("campaign_id", id)
          .eq("status", "pending")
          .limit(BATCH);
        if (error) throw new Error(error.message);
        type Row = { contact_id: string; contacts: { email: string; name: string; unsub_token: string; unsubscribed_at: string | null } };
        const rows = (pend ?? []) as unknown as Row[];
        // Quien se dio de baja después de crear la campaña no recibe nada.
        const skip = rows.filter((r) => r.contacts.unsubscribed_at);
        const go = rows.filter((r) => !r.contacts.unsubscribed_at);
        let sentNow = 0;
        let failedNow = 0;
        if (go.length) {
          const emails = go.map((r) => {
            const m = renderCampaign(camp.subject, camp.html, r.contacts, `${unsubBase}${r.contacts.unsub_token}`, brand);
            return emailOf(r.contacts.email, m.subject, m.html, r.contacts.unsub_token);
          });
          const ids = go.map((r) => r.contact_id);
          try {
            await resendBatch(emails);
            await db.from("campaign_recipients").update({ status: "sent", sent_at: new Date().toISOString() }).eq("campaign_id", id).in("contact_id", ids);
            sentNow = go.length;
          } catch (err) {
            const msg = err instanceof Error ? err.message.slice(0, 300) : "error";
            await db.from("campaign_recipients").update({ status: "failed", error: msg }).eq("campaign_id", id).in("contact_id", ids);
            failedNow = go.length;
          }
        }
        if (skip.length) {
          await db.from("campaign_recipients").update({ status: "failed", error: "dado de baja" }).eq("campaign_id", id).in("contact_id", skip.map((r) => r.contact_id));
          failedNow += skip.length;
        }
        const { count: remaining } = await db
          .from("campaign_recipients")
          .select("contact_id", { count: "exact", head: true })
          .eq("campaign_id", id)
          .eq("status", "pending");
        const { count: sent } = await db.from("campaign_recipients").select("contact_id", { count: "exact", head: true }).eq("campaign_id", id).eq("status", "sent");
        const { count: failed } = await db.from("campaign_recipients").select("contact_id", { count: "exact", head: true }).eq("campaign_id", id).eq("status", "failed");
        await db
          .from("campaigns")
          .update({ sent: sent ?? 0, failed: failed ?? 0, ...(remaining ? {} : { status: "done", finished_at: new Date().toISOString() }) })
          .eq("id", id);
        return json(200, { sentNow, failedNow, remaining: remaining ?? 0, sent: sent ?? 0, failed: failed ?? 0 });
      }
      default:
        return json(400, { error: "Acción desconocida." });
    }
  } catch (err) {
    console.error("campaign", err);
    return json(500, { error: err instanceof Error ? err.message : "Error inesperado." });
  }
});
