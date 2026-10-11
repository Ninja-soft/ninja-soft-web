"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ChatCircleDots } from "@phosphor-icons/react";
import { OPEN_CHAT } from "@/lib/chat-events";

// El chat completo (con supabase-js) se descarga recién cuando hace falta:
// al tocar el botón, al abrir el chat desde otro lado, o si este navegador ya tenía una conversación.
const ChatWidget = dynamic(() => import("./ChatWidget").then((m) => m.ChatWidget), { ssr: false });

export function ChatLauncher() {
  const [load, setLoad] = useState(false);
  const [openNow, setOpenNow] = useState(false);

  useEffect(() => {
    const open = () => {
      setOpenNow(true);
      setLoad(true);
    };
    window.addEventListener(OPEN_CHAT, open);
    // conversación previa en este navegador: cargar en segundo plano para recibir respuestas en vivo
    let hadSession = false;
    try {
      hadSession = !!localStorage.getItem("ns-chat");
    } catch {
      /* sin storage */
    }
    let idleId = 0;
    if (hadSession) {
      const go = () => setLoad(true);
      if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(go, { timeout: 4000 });
      else idleId = window.setTimeout(go, 2000);
    }
    return () => {
      window.removeEventListener(OPEN_CHAT, open);
      if (idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
    };
  }, []);

  if (load) return <ChatWidget initialOpen={openNow} />;
  return (
    <button
      type="button"
      onClick={() => {
        setOpenNow(true);
        setLoad(true);
      }}
      aria-label="Abrir chat"
      className="chat-fab"
    >
      <span aria-hidden className="chat-fab-ring" />
      <span className="chat-fab-icon">
        <ChatCircleDots size={28} weight="fill" />
      </span>
    </button>
  );
}
