import { handleContact } from "../_shared/contact.ts";
import { clientIp, cors, json, sha256 } from "../_shared/http.ts";
import { resendMailer } from "../_shared/resend.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";
import { telegramApi } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });
  try {
    const body = await req.json().catch(() => null);
    const r = await handleContact(
      { store: supabaseStore(adminClient()), mailer: (k) => resendMailer(k), telegram: (t, g) => telegramApi(t, g) },
      { ip: await sha256(clientIp(req)), body },
    );
    return json(r.status, r.json);
  } catch (err) {
    console.error("contact-submit", err);
    return json(500, { error: "No pudimos enviar tu consulta. Probá de nuevo." });
  }
});
