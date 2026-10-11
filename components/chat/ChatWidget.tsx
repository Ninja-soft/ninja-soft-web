"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ChatCircleDots, ImageSquare, NotePencil, PaperPlaneRight, X } from "@phosphor-icons/react";
import { ChatImage, compressImage } from "@/components/chat/ChatImage";
import { OPEN_CHAT } from "@/lib/chat-events";
import { visitorClient } from "@/lib/supabase/client";
import { functionError } from "@/lib/supabase/functionError";

// Chat web: los mensajes van a un tema de Telegram y las respuestas llegan por Realtime.
type Msg = { id: string; sender: "visitor" | "agent" | "system"; body: string; created_at: string; media_path?: string | null };
type Sess = { id: string; name: string; contact: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Sess | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const openRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [waitMinutes, setWaitMinutes] = useState(5);
  const [now, setNow] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const addMessages = useCallback((rows: Msg[]) => {
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev, ...rows.filter((r) => !seen.has(r.id))];
      return merged.sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }, []);

  const attach = useCallback(
    async (s: Sess) => {
      const sb = visitorClient();
      setSession(s);
      const { data } = await sb.from("chat_messages").select("id,sender,body,created_at,media_path").eq("session_id", s.id).order("created_at");
      if (data) addMessages(data as Msg[]);
      channelRef.current?.unsubscribe();
      channelRef.current = sb
        .channel(`chat:${s.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${s.id}` },
          (p) => {
            const m = p.new as Msg;
            if (m.sender === "agent" && !openRef.current) setUnread((n) => n + 1);
            addMessages([m]);
          },
        )
        .subscribe();
    },
    [addMessages],
  );

  // Retoma la conversación si este navegador ya chateó.
  useEffect(() => {
    const sb = visitorClient();
    let alive = true;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (!data.session || !alive) return;
      setLoading(true);
      const { data: s } = await sb.from("chat_sessions").select("id,name,contact").is("closed_at", null).maybeSingle();
      if (s && alive) await attach(s as Sess);
      if (alive) setLoading(false);
    })();
    sb.rpc("get_public_config").then(({ data }) => {
      const w = Number((data as { wait_minutes?: number } | null)?.wait_minutes);
      if (w > 0) setWaitMinutes(w);
    });
    return () => {
      alive = false;
      channelRef.current?.unsubscribe();
    };
  }, [attach]);

  useEffect(() => {
    openRef.current = open;
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener(OPEN_CHAT, h);
    return () => window.removeEventListener(OPEN_CHAT, h);
  }, []);

  // Latido: mientras el chat está abierto y visible, el visitante "está".
  useEffect(() => {
    if (!open || !session) return;
    const sb = visitorClient();
    const touch = () => {
      if (document.visibilityState === "visible") void sb.rpc("chat_touch");
    };
    touch();
    const id = window.setInterval(touch, 45_000);
    document.addEventListener("visibilitychange", touch);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", touch);
    };
  }, [open, session]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (sending || !message) return;
    setError(null);
    setSending(true);
    try {
      const sb = visitorClient();
      const { data: cur } = await sb.auth.getSession();
      if (!cur.session) {
        const { error: aerr } = await sb.auth.signInAnonymously();
        if (aerr) throw new Error("No pudimos iniciar el chat. Probá de nuevo.");
      }
      const { data, error: ferr } = await sb.functions.invoke("chat-send", { body: { name, contact, message, website } });
      if (ferr) throw new Error(await functionError(ferr, "No se pudo enviar. Probá de nuevo."));
      const r = data as { id: string; sessionId: string };
      if (!session) await attach({ id: r.sessionId, name: name.trim(), contact: contact.trim() });
      addMessages([{ id: r.id, sender: "visitor", body: message, created_at: new Date().toISOString() }]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setSending(false);
    }
  }

  // Foto: se comprime, se sube a la carpeta de la sesión y se avisa a chat-send.
  async function sendPhoto(file: File) {
    if (!session || sending) return;
    setError(null);
    setSending(true);
    const preview = URL.createObjectURL(file);
    setUploading(preview);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Sólo se pueden enviar fotos.");
      const sb = visitorClient();
      const blob = await compressImage(file);
      const path = `${session.id}/${crypto.randomUUID()}.jpg`;
      const up = await sb.storage.from("chat-media").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw new Error("No se pudo subir la foto.");
      const caption = text.trim();
      const { data, error: ferr } = await sb.functions.invoke("chat-send", { body: { message: caption, media_path: path } });
      if (ferr) throw new Error(await functionError(ferr, "No se pudo enviar la foto."));
      addMessages([{ id: (data as { id: string }).id, sender: "visitor", body: caption, media_path: path, created_at: new Date().toISOString() }]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la foto.");
    } finally {
      setSending(false);
      setUploading(null);
      URL.revokeObjectURL(preview);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Nuevo chat: cierra la conversación actual (queda en Telegram) y vuelve al primer paso.
  async function newChat() {
    if (sending) return;
    if (messages.length && !window.confirm("¿Empezar un chat nuevo? Esta conversación se cierra.")) return;
    await visitorClient().rpc("chat_close");
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setSession(null);
    setMessages([]);
    setText("");
    setError(null);
  }

  const last = messages[messages.length - 1];
  const waiting = !!last && last.sender === "visitor" && now - Date.parse(last.created_at) > waitMinutes * 60_000;
  const byEmail = !!session && session.contact.includes("@");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        aria-expanded={open}
        className={`chat-fab ${open ? "is-open max-sm:hidden" : ""}`}
      >
        <span aria-hidden className="chat-fab-ring" />
        <span className="chat-fab-icon">{open ? <X size={24} weight="bold" /> : <ChatCircleDots size={28} weight="fill" />}</span>
        {unread > 0 && !open && <span className="chat-fab-badge">{unread}</span>}
      </button>

      {open && (
        <section role="dialog" aria-label="Chat con Ninja Soft" className="chat-panel chat-panel-in">
          <header className="flex items-center gap-3 border-b border-black/[.06] px-4 py-3">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0b0720]">
              <img src="/images/brand/ninja-isotipo-flame.webp" alt="" width={240} height={311} className="h-6 w-auto" />
              <i aria-hidden className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#30d158] ring-2 ring-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-tight">Ninja Soft</p>
              <p className="text-[12px] text-[#86868b]">En línea · respondemos en minutos</p>
            </div>
            {session && (
              <button
                type="button"
                onClick={newChat}
                aria-label="Nuevo chat"
                title="Nuevo chat"
                className="grid h-9 w-9 place-items-center rounded-full bg-black/[.05] text-[#3a3a3c] transition hover:text-[#ff4b22]"
              >
                <NotePencil size={17} weight="bold" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="grid h-9 w-9 place-items-center rounded-full bg-black/[.05]"
            >
              <X size={16} weight="bold" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
            <Bubble sender="agent" body="¡Hola! 👋 Somos el equipo de Ninja Soft. Contanos qué necesitás para tu negocio y te respondemos por acá." />
            <p className="px-1 text-[12px] leading-snug text-[#86868b]">
              Si no te respondemos enseguida, te escribimos a tu email.
            </p>
            {loading && (
              <div role="status" aria-label="Cargando conversación" className="flex justify-center py-6">
                <span className="chat-spinner" />
              </div>
            )}
            {messages.map((m) => (
              <Bubble key={m.id} sender={m.sender} body={m.body} media={m.media_path} />
            ))}
            {uploading && (
              <div className="chat-bubble-in flex justify-end">
                <div className="relative overflow-hidden rounded-[14px]">
                  <img src={uploading} alt="" className="max-h-64 w-auto max-w-[240px] object-cover opacity-50" />
                  <div role="status" className="absolute inset-0 grid place-items-center bg-black/25">
                    <span className="flex flex-col items-center gap-2 text-[12.5px] font-semibold text-white">
                      <span className="chat-spinner chat-spinner-light" />
                      Subiendo foto…
                    </span>
                  </div>
                </div>
              </div>
            )}
            {waiting && (
              <p className="mx-auto max-w-[90%] rounded-2xl bg-black/[.04] px-3 py-2 text-center text-[12.5px] text-[#6e6e73]">
                Te respondemos a la brevedad.{" "}
                {byEmail ? `Si cerrás la página, te escribimos a ${session?.contact}.` : "Si cerrás la página, te contactamos."}
              </p>
            )}
          </div>

          <form onSubmit={send} className="border-t border-black/[.06] p-3">
            {!session && (
              <div className="mb-2 grid grid-cols-2 gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Tu nombre"
                  aria-label="Tu nombre"
                  className="chat-input"
                />
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  maxLength={120}
                  type="email"
                  autoComplete="email"
                  placeholder="Tu email"
                  aria-label="Tu email"
                  className="chat-input"
                />
              </div>
            )}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="hidden"
            />
            {error && (
              <p role="alert" className="mb-2 text-[12.5px] text-[#d70015]">
                {error}
              </p>
            )}
            <div className="flex items-end gap-2">
              {session && (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void sendPhoto(f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={sending}
                    aria-label="Enviar una foto"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f2f2f7] text-[#6e6e73] transition hover:text-[#ff4b22] disabled:opacity-40"
                  >
                    <ImageSquare size={22} weight="duotone" />
                  </button>
                </>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={1}
                maxLength={2000}
                placeholder="Escribí tu mensaje"
                aria-label="Mensaje"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                className="chat-input max-h-32 min-h-[44px] flex-1 resize-none"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                aria-label="Enviar"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#ff4b22,#ff8a1f)] text-white transition disabled:opacity-40"
              >
                <PaperPlaneRight size={20} weight="fill" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-[#aeaeb2]">Los mensajes se borran automáticamente a los 15 días.</p>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({ sender, body, media }: { sender: Msg["sender"]; body: string; media?: string | null }) {
  if (sender === "system") return <p className="text-center text-[12.5px] text-[#86868b]">{body}</p>;
  const mine = sender === "visitor";
  if (media) {
    return (
      <div className={`chat-bubble-in flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
        <ChatImage sb={visitorClient()} path={media} />
        {body && <Bubble sender={sender} body={body} />}
      </div>
    );
  }
  return (
    <div className={`chat-bubble-in flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[80%] whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2 text-[15px] leading-snug ${
          mine ? "bg-[linear-gradient(135deg,#ff4b22,#ff8a1f)] text-white" : "bg-[#f2f2f7] text-[#1d1d1f]"
        }`}
      >
        {body}
      </p>
    </div>
  );
}
