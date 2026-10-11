import { bearer, clientIp, cors, json, sha256 } from "../_shared/http.ts";
import { resendMailer } from "../_shared/resend.ts";
import { handleResumeRequest, handleResumeVerify } from "../_shared/resume.ts";
import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";
import { obj } from "../_shared/validate.ts";

// Retomar el chat en otro navegador: action "request" manda el PIN; "verify" lo valida y mueve la conversación.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });
  try {
    const db = adminClient();
    const store = supabaseStore(db);
    const body = await req.json().catch(() => null);
    if (obj(body).action === "verify") {
      const { data, error } = await db.auth.getUser(bearer(req));
      if (error || !data.user) return json(401, { error: "Sesión inválida. Recargá la página." });
      const r = await handleResumeVerify({ store }, { userId: data.user.id, body });
      return json(r.status, r.json);
    }
    const r = await handleResumeRequest({ store, mailer: (k) => resendMailer(k) }, { ip: await sha256(clientIp(req)), body });
    return json(r.status, r.json);
  } catch (err) {
    console.error("chat-resume", err);
    return json(500, { error: "No pudimos procesar el pedido. Probá de nuevo." });
  }
});
