import { bearer, cors, json } from "../_shared/http.ts";
import { resendMailer } from "../_shared/resend.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";
import { telegramApi } from "../_shared/telegram.ts";
import { EDITABLE_SECRETS, SECRET_NAMES, type SecretName } from "../_shared/types.ts";
import { emailList, isEmail, maskSecret, obj } from "../_shared/validate.ts";

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
    const saveSecret = async (name: SecretName, value: string) => {
      const { error } = await db.from("app_secrets").upsert({ name, value, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
    };

    switch (String(body.action ?? "")) {
      case "get": {
        const secrets: Record<string, string | null> = {};
        for (const n of SECRET_NAMES) secrets[n] = maskSecret(await store.secret(n));
        return json(200, { secrets });
      }
      case "set_secret": {
        const name = String(body.name ?? "") as SecretName;
        const value = String(body.value ?? "").trim();
        if (!EDITABLE_SECRETS.includes(name)) return json(400, { error: "Secreto no editable." });
        if (!value) return json(400, { error: "Ingresá un valor." });
        await saveSecret(name, value);
        return json(200, { ok: true, masked: maskSecret(value) });
      }
      case "register_webhook": {
        const token = await store.secret("telegram_bot_token");
        if (!token) return json(400, { error: "Cargá primero el token del bot." });
        const secret = crypto.randomUUID().replaceAll("-", "");
        await saveSecret("telegram_webhook_secret", secret);
        const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-webhook`,
            secret_token: secret,
            allowed_updates: ["message"],
            drop_pending_updates: true,
          }),
        });
        const d = obj(await r.json());
        if (d.ok !== true) return json(502, { error: `Telegram: ${String(d.description ?? r.status)}` });
        return json(200, { ok: true });
      }
      case "test_telegram": {
        const token = await store.secret("telegram_bot_token");
        if (!token || !s.telegram_group_id) return json(400, { error: "Falta el token o el ID del grupo." });
        await telegramApi(token, s.telegram_group_id).send(null, "✅ Prueba desde soft.ninja/internal: Telegram conectado.");
        return json(200, { ok: true });
      }
      case "test_resend": {
        const key = await store.secret("resend_api_key");
        const to = String(body.to ?? emailList(s.notify_email)[0] ?? "").trim();
        if (!key || !s.sender) return json(400, { error: "Falta la API key o el remitente." });
        if (!isEmail(to)) return json(400, { error: "Configurá un email de aviso válido." });
        await resendMailer(key)({ from: s.sender, to, subject: "Prueba de Resend · Ninja Soft", html: "<p>✅ Resend está conectado.</p>" });
        return json(200, { ok: true });
      }
      default:
        return json(400, { error: "Acción desconocida." });
    }
  } catch (err) {
    console.error("admin-settings", err);
    return json(500, { error: err instanceof Error ? err.message : "Error inesperado." });
  }
});
