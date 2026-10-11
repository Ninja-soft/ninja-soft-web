"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ChatImage } from "@/components/chat/ChatImage";

type Row = { id: string; name: string; contact: string; created_at: string; last_seen_at: string };
type Msg = { id: string; sender: string; body: string; created_at: string; media_path: string | null };
const fmt = (s: string) => new Date(s).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

export function ChatsTab({ sb }: { sb: SupabaseClient }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);

  useEffect(() => {
    sb.from("chat_sessions")
      .select("id,name,contact,created_at,last_seen_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, [sb]);

  useEffect(() => {
    if (!sel) return;
    sb.from("chat_messages")
      .select("id,sender,body,created_at,media_path")
      .eq("session_id", sel)
      .order("created_at")
      .then(({ data }) => setMsgs((data ?? []) as Msg[]));
  }, [sb, sel]);

  if (!rows.length) return <p className="text-[#86868b]">Todavía no hay chats.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      <ul className="int-card divide-y divide-black/[.06] overflow-hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => setSel(r.id)} className={`w-full px-4 py-3 text-left ${sel === r.id ? "bg-[#fff1ea]" : ""}`}>
              <b className="block text-[15px]">{r.name}</b>
              <span className="block text-[13px] text-[#6e6e73]">{r.contact}</span>
              <span className="block text-[12px] text-[#86868b]">{fmt(r.created_at)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="int-card min-h-[300px] space-y-2 p-4">
        {!sel && <p className="text-[#86868b]">Elegí un chat. Las respuestas se escriben desde Telegram.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "visitor" ? "justify-start" : "justify-end"}`}>
            <p className={`max-w-[80%] whitespace-pre-wrap rounded-[16px] px-3 py-2 text-[14px] ${m.sender === "visitor" ? "bg-[#f2f2f7]" : "bg-[#ff4b22] text-white"}`}>
              {m.media_path && <ChatImage sb={sb} path={m.media_path} />}
              {m.body}
              <span className="mt-1 block text-[11px] opacity-60">{fmt(m.created_at)}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
