import { resendMailer } from "../_shared/resend.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";
import { handleTelegramUpdate } from "../_shared/webhook.ts";

// Telegram reintenta si no recibe 200: respondemos 200 salvo secreto inválido.
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const store = supabaseStore(adminClient());
  const expected = await store.secret("telegram_webhook_secret");
  if (!expected || req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== expected) {
    return new Response("forbidden", { status: 403 });
  }
  const update = await req.json().catch(() => null);
  try {
    await handleTelegramUpdate({ store, mailer: (k) => resendMailer(k) }, update);
  } catch (err) {
    console.error("telegram-webhook", err);
  }
  return new Response("ok");
});
