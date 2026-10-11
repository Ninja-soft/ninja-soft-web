import { handleChatSend } from "../_shared/chatSend.ts";
import { bearer, clientIp, cors, json, sha256 } from "../_shared/http.ts";
import { adminClient, storageMedia, supabaseStore } from "../_shared/supabaseStore.ts";
import { telegramApi } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Método no permitido" });
  try {
    const db = adminClient();
    const { data, error } = await db.auth.getUser(bearer(req));
    if (error || !data.user) return json(401, { error: "Sesión inválida. Recargá la página." });
    const body = await req.json().catch(() => null);
    const r = await handleChatSend(
      { store: supabaseStore(db), telegram: (t, g) => telegramApi(t, g), media: storageMedia(db) },
      { userId: data.user.id, ip: await sha256(clientIp(req)), body },
    );
    return json(r.status, r.json);
  } catch (err) {
    console.error("chat-send", err);
    return json(500, { error: "No pudimos enviar tu mensaje. Probá de nuevo." });
  }
});
