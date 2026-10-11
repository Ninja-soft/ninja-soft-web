"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { internalClient } from "@/lib/supabase/client";
import { ChatsTab } from "./ChatsTab";
import { ContactsTab } from "./ContactsTab";
import { HomeTab } from "./HomeTab";
import { LoginForm, SetPasswordForm } from "./LoginForm";
import { SettingsTab } from "./SettingsTab";
import { TeamTab } from "./TeamTab";
import { TemplatesTab } from "./TemplatesTab";

const TABS = [
  { key: "home", label: "Inicio" },
  { key: "chats", label: "Chats" },
  { key: "contacts", label: "Contactos" },
  { key: "settings", label: "Configuración" },
  { key: "templates", label: "Plantillas" },
  { key: "team", label: "Equipo" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="int-bg grid min-h-screen place-items-center px-4">{children}</main>;
}

// Cierre de sesión por inactividad (8 h). La marca vive en localStorage para valer entre pestañas.
const IDLE_MS = 8 * 60 * 60 * 1000;
const IDLE_KEY = "ns-internal-last-activity";
function lastActivity(): number {
  try {
    return Number(localStorage.getItem(IDLE_KEY)) || 0;
  } catch {
    return 0;
  }
}
function touchActivity() {
  try {
    localStorage.setItem(IDLE_KEY, String(Date.now()));
  } catch {
    /* sin storage: no se puede medir inactividad */
  }
}

export function InternalApp() {
  const sb = internalClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabKey>("home");
  // Viene de una invitación o de "olvidé mi contraseña": primero elige contraseña.
  const [setPw, setSetPw] = useState(false);

  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      // Inactivo hace más de 8 h: se cierra la sesión ANTES de mostrar el panel.
      if (data.session && Date.now() - lastActivity() > IDLE_MS) {
        await sb.auth.signOut();
        setSession(null);
      } else {
        if (data.session) touchActivity();
        setSession(data.session);
      }
      setReady(true);
    });
    if (new URLSearchParams(window.location.search).get("setpw") === "1") setSetPw(true);
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setSetPw(true);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  // Mientras hay sesión: cualquier interacción renueva la actividad; cada minuto se controla el límite.
  useEffect(() => {
    if (!session) return;
    touchActivity();
    let last = 0;
    const onActivity = () => {
      if (Date.now() - last > 30_000) {
        last = Date.now();
        touchActivity();
      }
    };
    const check = () => {
      if (Date.now() - lastActivity() > IDLE_MS) void sb.auth.signOut();
    };
    const events = ["pointerdown", "keydown", "scroll", "visibilitychange"] as const;
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", check);
    const id = window.setInterval(check, 60_000);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      document.removeEventListener("visibilitychange", check);
      window.clearInterval(id);
    };
  }, [sb, session]);

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

  if (!ready) return <Shell><span role="status" aria-label="Cargando" className="int-spinner" /></Shell>;
  if (!session) return <LoginForm />;
  if (setPw)
    return (
      <SetPasswordForm
        onDone={() => {
          setSetPw(false);
          window.history.replaceState(null, "", "/internal");
        }}
      />
    );
  if (admin === null) return <Shell><span role="status" aria-label="Cargando" className="int-spinner" /></Shell>;
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
    <div className="int-bg min-h-screen text-[#1d1d1f]">
      <header className="sticky top-0 z-10 border-b border-black/[.06] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3">
          <img src="/images/brand/ninja-isotipo-flame.webp" alt="" width={240} height={311} className="h-7 w-auto" />
          <b className="text-[15px]">Internal</b>
          <nav className="order-last flex w-full gap-1 overflow-x-auto rounded-full bg-black/[.05] p-1 sm:order-none sm:w-auto" aria-label="Secciones">
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
        {tab === "team" && <TeamTab sb={sb} />}
      </main>
    </div>
  );
}
