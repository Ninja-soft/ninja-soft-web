import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import type { Session, Store, Template } from "./types.ts";

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const SESSION_COLS = "id,user_id,name,contact,telegram_thread_id,last_seen_at";

// deno-lint-ignore no-explicit-any
function must(r: { data: any; error: { message: string } | null }) {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export function supabaseStore(db: SupabaseClient): Store {
  return {
    async settings() {
      const rows: { key: string; value: string }[] = must(await db.from("app_settings").select("key,value"));
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    },
    async secret(name) {
      const r = must(await db.from("app_secrets").select("value").eq("name", name).maybeSingle());
      return r?.value || null;
    },
    async sessionForUser(userId) {
      return must(
        await db.from("chat_sessions").select(SESSION_COLS).eq("user_id", userId).is("closed_at", null).maybeSingle(),
      ) as Session | null;
    },
    async sessionByThread(threadId) {
      return must(await db.from("chat_sessions").select(SESSION_COLS).eq("telegram_thread_id", threadId).maybeSingle()) as
        | Session
        | null;
    },
    async createSession(userId, name, contact) {
      return must(
        await db.from("chat_sessions").insert({ user_id: userId, name, contact }).select(SESSION_COLS).single(),
      ) as Session;
    },
    async setThread(sessionId, threadId) {
      must(await db.from("chat_sessions").update({ telegram_thread_id: threadId }).eq("id", sessionId));
    },
    async addMessage(m) {
      return must(await db.from("chat_messages").insert(m).select("id").single());
    },
    async markEmailed(id) {
      must(await db.from("chat_messages").update({ emailed_at: new Date().toISOString() }).eq("id", id));
    },
    async countRecent(bucket, windowMs) {
      const since = new Date(Date.now() - windowMs).toISOString();
      const { count, error } = await db
        .from("rate_events")
        .select("id", { count: "exact", head: true })
        .eq("bucket", bucket)
        .gte("created_at", since);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    async hit(bucket) {
      must(await db.from("rate_events").insert({ bucket }));
      // limpieza ocasional de eventos viejos
      if (Math.random() < 0.05) {
        await db.from("rate_events").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
      }
    },
    async template(key) {
      return must(await db.from("email_templates").select("subject,html").eq("key", key).maybeSingle()) as Template | null;
    },
    async saveContact(c) {
      return must(
        await db
          .from("contact_requests")
          .insert({
            name: c.name,
            email: c.email,
            phone: c.phone || null,
            business: c.business || null,
            message: c.message,
            meeting: c.meeting,
            meeting_pref: c.meeting_pref || null,
            ip_hash: c.ip_hash,
          })
          .select("id")
          .single(),
      );
    },
    async setSetting(key, value) {
      must(await db.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }));
    },
  };
}
