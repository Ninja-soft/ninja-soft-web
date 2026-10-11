// Genera el secreto del webhook, lo guarda y registra la URL en Telegram (mismo efecto que el botón de /internal).
import { randomUUID } from "node:crypto";
import { lit, SB_URL, sql } from "./sb.mjs";

const [{ value: token } = {}] = await sql("select value from app_secrets where name = 'telegram_bot_token'");
if (!token) throw new Error("Primero: node scripts/set-secret.mjs telegram_bot_token <archivo>");
const secret = randomUUID().replaceAll("-", "");
await sql(
  `insert into app_secrets (name, value) values ('telegram_webhook_secret', ${lit(secret)})
   on conflict (name) do update set value = excluded.value, updated_at = now()`,
);
const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `${SB_URL}/functions/v1/telegram-webhook`,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  }),
});
const d = await r.json();
if (!d.ok) throw new Error(`Telegram: ${d.description}`);
const info = await (await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)).json();
console.log("Webhook:", info.result.url, "· pendientes:", info.result.pending_update_count);
