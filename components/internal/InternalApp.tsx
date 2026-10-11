"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { internalClient } from "@/lib/supabase/client";
import { ChatsTab } from "./ChatsTab";
import { ContactsTab } from "./ContactsTab";
import { HomeTab } from "./HomeTab";
import { LoginForm } from "./LoginForm";
import { SettingsTab } from "./SettingsTab";
import { TemplatesTab } from "./TemplatesTab";

const TABS = [
  { key: "home", label: "Inicio" },
  { key: "chats", label: "Chats" },
  { key: "contacts", label: "Contactos" },
  { key: "settings", label: "Configuración" },
  { key: "templates", label: "Plantillas" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-[#f5f5f7] px-4">{children}</main>;
}

export function InternalApp() {
  const sb = internalClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabKey>("home");

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!session) {
      setAdmin(null);
      return;
    }
    sb.from("internal_admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setAdmin(!!data));
  }, [sb, session]);

  if (!ready) return <Shell><p className="text-[#86868b]">Cargando…</p></Shell>;
  if (!session) return <Shell><LoginForm /></Shell>;
  if (admin === null) return <Shell><p className="text-[#86868b]">Verificando acceso…</p></Shell>;
  if (!admin) {
    return (
      <Shell>
        <div className="text-center">
          <p>Tu usuario no tiene acceso al panel interno.</p>
          <button type="button" onClick={() => sb.auth.signOut()} className="link-more mt-4">
            Salir
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header className="sticky top-0 z-10 border-b border-black/[.06] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3">
          <img src="/images/brand/ninja-isotipo-flame.webp" alt="" width={240} height={311} className="h-7 w-auto" />
          <b className="text-[15px]">Internal</b>
          <nav className="seg order-last w-full overflow-x-auto sm:order-none sm:w-auto" aria-label="Secciones">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[14px] font-medium ${
                  tab === t.key ? "bg-white shadow-sm" : "text-[#6e6e73]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <span className="ml-auto hidden text-[13px] text-[#86868b] sm:inline">{session.user.email}</span>
          <button type="button" onClick={() => sb.auth.signOut()} className="text-[14px] font-semibold text-flame-link">
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 py-8">
        {tab === "home" && <HomeTab sb={sb} />}
        {tab === "chats" && <ChatsTab sb={sb} />}
        {tab === "contacts" && <ContactsTab sb={sb} />}
        {tab === "settings" && <SettingsTab sb={sb} />}
        {tab === "templates" && <TemplatesTab sb={sb} />}
      </main>
    </div>
  );
}
