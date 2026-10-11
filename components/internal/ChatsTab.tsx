"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowLeft, ChatsCircle, MagnifyingGlass, PaperPlaneRight, TelegramLogo } from "@phosphor-icons/react";
import { ChatImage } from "@/components/chat/ChatImage";
import { Avatar, Empty, PageHeader, Spinner, SpinnerBlock, timeAgo } from "./ui";

type Row = {
  id: string;
  name: string;
  contact: string;
  telegram_thread_id: number | null;
  created_at: string;
  closed_at: string | null;
  last_body: string | null;
  last_sender: string | null;
  last_media: boolean;
  last_at: string;
  total: number;
};
type Msg = { id: string; sender: string; body: string; created_at: string; media_path: string | null };

const GROUP = "1003773063419".replace(/^100/, ""); // id del grupo sin el prefijo -100 de Telegram
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
const hour = (iso: string) => new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

export function ChatsTab({ sb }: { sb: SupabaseClient }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | "esperando">("todos");
  const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const listEnd = useRef<HTMLDivElement>(null);

  const load = useCallback(() => sb.rpc("internal_chat_list").then(({ data }) => setRows((data ?? []) as Row[])), [sb]);

  useEffect(() => {
    void load();
    // en vivo: cualquier mensaje nuevo refresca la lista y la conversación abierta
    const ch = sb
      .channel("internal-chats")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p) => {
        void load();
        const m = p.new as Msg & { session_id: string };
        setMsgs((prev) => (prev && m.session_id === selRef.current && !prev.some((x) => x.id === m.id) ? [...prev, m] : prev));
      })
      .subscribe();
    return () => {
      void sb.removeChannel(ch);
    };
  }, [sb, load]);

  const selRef = useRef<string | null>(null);
  useEffect(() => {
    selRef.current = sel;
    if (!sel) return;
    setMsgs(null);
    sb.from("chat_messages")
      .select("id,sender,body,created_at,media_path")
      .eq("session_id", sel)
      .order("created_at")
      .then(({ data }) => setMsgs((data ?? []) as Msg[]));
  }, [sb, sel]);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (filter === "todos" || r.last_sender === "visitor") &&
        (!t || r.name.toLowerCase().includes(t) || r.contact.toLowerCase().includes(t) || (r.last_body ?? "").toLowerCase().includes(t)),
    );
  }, [rows, q, filter]);
  const waiting = (rows ?? []).filter((r) => r.last_sender === "visitor").length;
  const current = rows?.find((r) => r.id === sel) ?? null;

  return (
    <div>
      <PageHeader eyebrow="Conversaciones" title="Chats" desc="Todo lo que escriben en la web. Se responde desde Telegram y aparece acá en vivo." />

      <div className="ix-card grid h-[calc(100dvh-260px)] min-h-[520px] overflow-hidden md:grid-cols-[340px_1fr]">
        {/* lista */}
        <aside className={`flex min-h-0 flex-col border-white/10 md:border-r ${sel ? "hidden md:flex" : "flex"}`}>
          <div className="space-y-2 border-b border-white/10 p-3">
            <label className="relative block">
              <MagnifyingGlass size={15} className="ix-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, email o mensaje" className="ix-input pl-9" />
            </label>
            <div className="flex gap-1">
              {(
                [
                  ["todos", `Todos${rows ? ` · ${rows.length}` : ""}`],
                  ["esperando", `Esperando · ${waiting}`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold ${filter === k ? "bg-white/[.12] text-white" : "ix-muted hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!rows ? (
              <SpinnerBlock />
            ) : !shown.length ? (
              <Empty icon={ChatsCircle} title={rows.length ? "Sin resultados" : "Todavía no hay chats"} desc={rows.length ? "Probá con otra búsqueda." : "Cuando alguien escriba en la web lo vas a ver acá."} />
            ) : (
              <ul>
                {shown.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSel(r.id)}
                      className={`flex w-full items-center gap-3 border-b border-white/[.05] px-3 py-3 text-left transition ${sel === r.id ? "bg-[rgba(255,75,34,.12)]" : "hover:bg-white/[.03]"}`}
                    >
                      <Avatar name={r.name} size={42} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <b className="truncate text-[14px] font-semibold">{r.name}</b>
                          <span className={`shrink-0 text-[11px] ${r.last_sender === "visitor" ? "font-semibold text-[#ff8a4c]" : "ix-muted"}`}>{timeAgo(r.last_at)}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span className="ix-muted min-w-0 flex-1 truncate text-[13px]">
                            {r.last_sender === "agent" && "Vos: "}
                            {r.last_media && !r.last_body ? "📷 Foto" : r.last_body ?? "Sin mensajes"}
                          </span>
                          {r.last_sender === "visitor" && <span className="ix-pill shrink-0 bg-[rgba(255,106,26,.15)] text-[#ff8a4c]">Esperando</span>}
                          {r.closed_at && <span className="ix-pill shrink-0 bg-white/[.06] text-[#a99fd0]">Cerrado</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* conversación */}
        <section className={`min-h-0 flex-col ${sel ? "flex" : "hidden md:flex"}`}>
          {!current ? (
            <div className="grid flex-1 place-items-center">
              <Empty icon={ChatsCircle} title="Elegí una conversación" desc="Las respuestas se escriben desde el tema del visitante en Telegram." />
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <button type="button" onClick={() => setSel(null)} aria-label="Volver" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/[.06] md:hidden">
                  <ArrowLeft size={18} />
                </button>
                <Avatar name={current.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{current.name}</p>
                  <a href={`mailto:${current.contact}`} className="ix-muted block truncate text-[13px] hover:text-white">
                    {current.contact}
                  </a>
                </div>
                {current.telegram_thread_id && (
                  <a href={`https://t.me/c/${GROUP}/${current.telegram_thread_id}`} target="_blank" rel="noopener noreferrer" className="ix-btn ix-btn-primary h-9 px-3 text-[13px]">
                    <TelegramLogo size={16} weight="fill" /> <span className="hidden sm:inline">Responder en Telegram</span>
                  </a>
                )}
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {!msgs ? (
                  <div className="grid h-full place-items-center">
                    <Spinner size={26} />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {msgs.map((m, k) => {
                      const newDay = k === 0 || new Date(msgs[k - 1].created_at).toDateString() !== new Date(m.created_at).toDateString();
                      const mine = m.sender === "agent";
                      return (
                        <div key={m.id}>
                          {newDay && (
                            <p className="ix-muted my-3 text-center text-[11px] font-semibold uppercase tracking-[.1em]">{dayLabel(m.created_at)}</p>
                          )}
                          <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[78%] rounded-[16px] px-3.5 py-2 ${mine ? "rounded-br-md bg-[linear-gradient(135deg,#ff4b22,#ff8a1f)] text-white" : "rounded-bl-md bg-white/[.07]"}`}>
                              {m.media_path && <ChatImage sb={sb} path={m.media_path} />}
                              {m.body && <p className="whitespace-pre-wrap break-words text-[14.5px] leading-snug">{m.body}</p>}
                              <p className={`mt-0.5 text-right text-[10.5px] ${mine ? "text-white/70" : "ix-muted"}`}>{hour(m.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={listEnd} />
                  </div>
                )}
              </div>
              <footer className="ix-muted flex items-center gap-2 border-t border-white/10 px-4 py-3 text-[12.5px]">
                <PaperPlaneRight size={14} /> Para responder usá Telegram: la respuesta le llega al visitante en vivo (o por email si se fue).
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
