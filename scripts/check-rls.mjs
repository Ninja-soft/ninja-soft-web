// Prueba de aislamiento: un visitante no ve chats ajenos; anónimos no leen secretos ni plantillas.
import { createClient } from "@supabase/supabase-js";
import { SB_URL, sql } from "./sb.mjs";

const KEY = "sb_publishable_fG1o48fuiu4btUgef7zoPg_JI25lETn";
const mk = () => createClient(SB_URL, KEY, { auth: { persistSession: false } });
let fails = 0;
const check = (ok, label) => {
  console.log(ok ? "OK   " : "FALLA", label);
  if (!ok) fails++;
};

const a = mk();
await a.auth.signInAnonymously();
const sent = await a.functions.invoke("chat-send", { body: { name: "RLS Test", contact: "rls@test.com", message: "hola rls" } });
check(sent.data?.ok === true, "A puede escribir");
const mineA = await a.from("chat_messages").select("id");
check(mineA.data?.length === 1, "A ve su mensaje");

const b = mk();
await b.auth.signInAnonymously();
const sessB = await b.from("chat_sessions").select("id");
const msgB = await b.from("chat_messages").select("id");
check(sessB.data?.length === 0 && msgB.data?.length === 0, "B no ve el chat de A");
for (const t of ["app_secrets", "email_templates", "app_settings", "contact_requests", "rate_events"]) {
  const r = await b.from(t).select("*");
  check((r.data?.length ?? 0) === 0, `B no lee ${t}`);
}
const ins = await b.from("chat_messages").insert({ session_id: sessB.data?.[0]?.id ?? "00000000-0000-0000-0000-000000000000", sender: "agent", body: "x" });
check(!!ins.error, "B no puede insertar mensajes directo");

await sql("delete from auth.users where id in (select user_id from chat_sessions where name = 'RLS Test')");
const ids = [(await a.auth.getUser()).data.user?.id, (await b.auth.getUser()).data.user?.id].filter(Boolean);
if (ids.length) await sql(`delete from auth.users where id in (${ids.map((i) => `'${i}'`).join(",")})`);
console.log(fails ? `${fails} fallas` : "RLS OK");
process.exit(fails ? 1 : 0);
