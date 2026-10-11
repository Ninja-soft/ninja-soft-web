import { adminClient, supabaseStore } from "../_shared/supabaseStore.ts";

// Retención de 15 días: borra las fotos de las sesiones vencidas y después las sesiones (la llama pg_cron).
Deno.serve(async (req) => {
  const db = adminClient();
  const expected = await supabaseStore(db).secret("cron_secret");
  if (!expected || req.headers.get("x-cron-secret") !== expected) return new Response("forbidden", { status: 403 });

  const { data: ids, error } = await db.rpc("chat_sessions_to_purge");
  if (error) return new Response(error.message, { status: 500 });

  let files = 0;
  for (const id of (ids ?? []) as string[]) {
    const { data: list } = await db.storage.from("chat-media").list(id, { limit: 1000 });
    const paths = (list ?? []).map((f) => `${id}/${f.name}`);
    if (paths.length) {
      await db.storage.from("chat-media").remove(paths);
      files += paths.length;
    }
  }
  const { error: perr } = await db.rpc("purge_old_chats");
  if (perr) return new Response(perr.message, { status: 500 });
  return new Response(JSON.stringify({ sessions: (ids ?? []).length, files }), { headers: { "Content-Type": "application/json" } });
});
