import { renderCampaign } from "../_shared/campaign.ts";
import { bearer, cors, json, sha256 } from "../_shared/http.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";
import { brandVars } from "../_shared/template.ts";
import { obj } from "../_shared/validate.ts";

// Campañas por email (sólo admins). El panel crea la campaña y la envía por lotes de 100 llamando
// a send_batch hasta que no queden pendientes. Cada lote se RECLAMA atómicamente en la base
// (dos pestañas no envían lo mismo) y va a Resend con Idempotency-Key (un reintento no duplica).
// Errores temporales de Resend (límite diario, 429, 5xx) devuelven el lote a pendiente y frenan el envío.
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
    const brand = { ...brandVars(s), link_sitio: s.site_url };
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
    const resendBatch = async (emails: unknown[], idempotencyKey?: string) => {
      const r = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        },
        body: JSON.stringify(emails),
      });
      return { ok: r.ok, status: r.status, text: r.ok ? "" : await r.text() };
    };

    const subject = String(body.subject ?? "").trim();
    const html = String(body.html ?? "");
    switch (String(body.action ?? "")) {
      case "test": {
        if (!subject || !html) return json(400, { error: "Completá asunto y contenido." });
        const msg = renderCampaign(subject, html, { name: "Lucas", email: u.user.email ?? "" }, "#baja-de-prueba", brand);
        const r = await resendBatch([emailOf(u.user.email ?? "", `[Prueba] ${msg.subject}`, msg.html, null)]);
        if (!r.ok) return json(502, { error: `Resend ${r.status}: ${r.text.slice(0, 200)}` });
        return json(200, { ok: true, to: u.user.email });
      }
      case "start": {
        if (!subject || !html) return json(400, { error: "Completá asunto y contenido." });
        const draftId = typeof body.draft_id === "string" && body.draft_id ? body.draft_id : null;
        const { data, error } = await db.rpc("campaign_start", { p_subject: subject, p_html: html, p_user: u.user.id, p_draft: draftId });
        if (error) return json(400, { error: error.message });
        const row = (data as { id: string; total: number }[])[0];
        return json(200, { id: row.id, total: row.total });
      }
      case "send_batch": {
        const id = String(body.id ?? "");
        const { data: camp } = await db.from("campaigns").select("id,subject,html,status").eq("id", id).maybeSingle();
        if (!camp) return json(404, { error: "Campaña inexistente." });
        if (camp.status !== "sending") return json(409, { error: "Esta campaña no está en envío." });

        const { data: claimed, error } = await db.rpc("campaign_claim", { p_campaign: id, p_limit: BATCH });
        if (error) throw new Error(error.message);
        type Row = { contact_id: string; email: string; name: string; unsub_token: string; unsubscribed_at: string | null };
        const rows = (claimed ?? []) as Row[];
        const mark = async (ids: string[], patch: Record<string, unknown>) => {
          if (ids.length) await db.from("campaign_recipients").update(patch).eq("campaign_id", id).in("contact_id", ids);
        };
        // Quien se dio de baja después de crear la campaña no recibe nada.
        await mark(
          rows.filter((r) => r.unsubscribed_at).map((r) => r.contact_id),
          { status: "failed", error: "dado de baja" },
        );
        const go = rows.filter((r) => !r.unsubscribed_at);
        let stop: string | null = null;
        if (go.length) {
          const ids = go.map((r) => r.contact_id);
          const emails = go.map((r) => {
            const m = renderCampaign(camp.subject, camp.html, r, `${unsubBase}${r.unsub_token}`, brand);
            return emailOf(r.email, m.subject, m.html, r.unsub_token);
          });
          const idem = `camp-${id}-${(await sha256(ids.slice().sort().join(","))).slice(0, 24)}`;
          const res = await resendBatch(emails, idem);
          if (res.ok) await mark(ids, { status: "sent", sent_at: new Date().toISOString() });
          else if (res.status === 429 || res.status >= 500) {
            // temporal (límite diario/por segundo o caída): vuelven a pendiente y se frena el envío
            await mark(ids, { status: "pending", claimed_at: null });
            stop = res.status === 429 ? "Resend alcanzó el límite de envíos (en el plan gratis son 100 por día). Reanudá más tarde." : `Resend no respondió (${res.status}). Reanudá en unos minutos.`;
          } else await mark(ids, { status: "failed", error: `Resend ${res.status}: ${res.text.slice(0, 250)}` });
        }

        const count = async (st: string) =>
          (await db.from("campaign_recipients").select("contact_id", { count: "exact", head: true }).eq("campaign_id", id).eq("status", st)).count ?? 0;
        const [pending, inFlight, sent, failed] = await Promise.all([count("pending"), count("sending"), count("sent"), count("failed")]);
        const remaining = pending + inFlight;
        await db
          .from("campaigns")
          .update({ sent, failed, ...(remaining ? {} : { status: "done", finished_at: new Date().toISOString() }) })
          .eq("id", id);
        if (stop) return json(503, { error: stop, sent, failed, remaining });
        return json(200, { remaining, sent, failed });
      }
      default:
        return json(400, { error: "Acción desconocida." });
    }
  } catch (err) {
    console.error("campaign", err);
    return json(500, { error: err instanceof Error ? err.message : "Error inesperado." });
  }
});
