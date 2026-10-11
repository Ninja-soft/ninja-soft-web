"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AddressBook,
  ArrowSquareOut,
  CaretUpDown,
  ChartLineUp,
  ChatsCircle,
  EnvelopeSimple,
  GearSix,
  House,
  Key,
  List,
  Megaphone,
  SignOut,
  UsersThree,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { Year } from "@/components/Year";
import { internalClient } from "@/lib/supabase/client";
import { CampaignsTab } from "./CampaignsTab";
import { ChatsTab } from "./ChatsTab";
import { ContactsTab } from "./ContactsTab";
import { HomeTab } from "./HomeTab";
import { LoginForm, SetPasswordForm } from "./LoginForm";
import { SettingsTab } from "./SettingsTab";
import { StatsTab } from "./StatsTab";
import { TeamTab } from "./TeamTab";
import { TemplatesTab } from "./TemplatesTab";
import { Avatar, Spinner } from "./ui";

const NAV: { key: string; label: string; Icon: Icon }[] = [
  { key: "inicio", label: "Inicio", Icon: House },
  { key: "estadisticas", label: "Estadísticas", Icon: ChartLineUp },
  { key: "chats", label: "Chats", Icon: ChatsCircle },
  { key: "contactos", label: "Contactos", Icon: AddressBook },
  { key: "campanas", label: "Campañas", Icon: Megaphone },
  { key: "plantillas", label: "Plantillas", Icon: EnvelopeSimple },
  { key: "equipo", label: "Equipo", Icon: UsersThree },
  { key: "configuracion", label: "Configuración", Icon: GearSix },
];

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

const tabFromHash = () => {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace("#", "");
  return NAV.some((n) => n.key === h) ? h : "inicio";
};

function Center({ children }: { children: React.ReactNode }) {
  return <main className="ix ix-bg grid min-h-screen place-items-center px-4">{children}</main>;
}

export function InternalApp() {
  const sb = internalClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState("inicio");
  // Viene de una invitación o de "olvidé mi contraseña": primero elige contraseña.
  const [setPw, setSetPw] = useState(false);

  useEffect(() => {
    setTab(tabFromHash());
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

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
    const events = ["pointerdown", "keydown", "scroll"] as const;
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

  if (!ready) return <Center><Spinner size={32} /></Center>;
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
  if (admin === null) return <Center><Spinner size={32} /></Center>;
  if (!admin) {
    return (
      <Center>
        <div className="ix-card max-w-sm p-8 text-center">
          <p className="font-semibold">Tu usuario no tiene acceso al panel interno.</p>
          <button type="button" onClick={() => sb.auth.signOut()} className="ix-btn mt-5">
            Cerrar sesión
          </button>
        </div>
      </Center>
    );
  }

  const go = (key: string) => {
    window.location.hash = key;
    setTab(key);
  };

  return (
    <Shell session={session} tab={tab} onGo={go} onSignOut={() => sb.auth.signOut()}>
      {tab === "inicio" && <HomeTab sb={sb} onGo={go} />}
      {tab === "estadisticas" && <StatsTab sb={sb} />}
      {tab === "chats" && <ChatsTab sb={sb} />}
      {tab === "contactos" && <ContactsTab sb={sb} />}
      {tab === "campanas" && <CampaignsTab sb={sb} />}
      {tab === "plantillas" && <TemplatesTab sb={sb} />}
      {tab === "equipo" && <TeamTab sb={sb} />}
      {tab === "configuracion" && <SettingsTab sb={sb} />}
    </Shell>
  );
}

function displayName(session: Session) {
  const meta = session.user.user_metadata as { name?: string; full_name?: string } | undefined;
  const raw = meta?.full_name || meta?.name || (session.user.email ?? "").split("@")[0];
  return raw.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Shell({
  session,
  tab,
  onGo,
  onSignOut,
  children,
}: {
  session: Session;
  tab: string;
  onGo: (k: string) => void;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const name = displayName(session);

  const nav = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <button type="button" onClick={() => onGo("inicio")} className="mb-3 flex items-center px-2 py-2">
        <img src="/images/brand/ninjasoft-logo-dark.webp" alt="Ninja Soft" width={640} height={145} className="h-8 w-auto" />
      </button>
      {NAV.map(({ key, label, Icon: I }) => (
        <button
          key={key}
          type="button"
          onClick={() => {
            onGo(key);
            setDrawer(false);
          }}
          className={`ix-nav-item ${tab === key ? "is-active" : ""}`}
          aria-current={tab === key ? "page" : undefined}
        >
          <I size={18} weight={tab === key ? "fill" : "regular"} />
          {label}
        </button>
      ))}
      <div className="mt-auto space-y-2 pt-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-[rgba(22,15,48,.72)] p-2 text-[14px] transition hover:bg-white/[.06]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.05] text-[#ff8a4c]">
            <ArrowSquareOut size={16} />
          </span>
          Ver el sitio
        </a>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            className="flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-[rgba(22,15,48,.72)] p-2 text-left transition hover:bg-white/[.06]"
          >
            <Avatar name={name} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium">{name}</span>
              <span className="ix-muted block truncate text-[12px]">{session.user.email}</span>
              <span className="block text-[11px] font-medium text-[#ff8a4c]">Admin</span>
            </span>
            <CaretUpDown size={15} className="ix-muted shrink-0" />
          </button>
          {menu && (
            <div className="ix-pop ix-fade absolute bottom-full left-0 z-50 mb-2 w-full">
              <p className="ix-muted truncate px-3 py-2 text-[12px]">{session.user.email}</p>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setPwOpen(true);
                }}
                className="ix-pop-item"
              >
                <Key size={16} /> Cambiar contraseña
              </button>
              <div className="my-1 h-px bg-white/10" />
              <button type="button" onClick={onSignOut} className="ix-pop-item text-[#fca5a5]">
                <SignOut size={16} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="ix flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-white/10 bg-[#0a0518]/60 backdrop-blur-xl lg:block">{nav}</aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Cerrar menú" onClick={() => setDrawer(false)} className="ix-fade absolute inset-0 bg-black/50" />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-white/10 bg-[#15103a]">
            <button type="button" aria-label="Cerrar menú" onClick={() => setDrawer(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg hover:bg-white/[.06]">
              <X size={18} />
            </button>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0a0518]/70 px-4 backdrop-blur-xl lg:hidden">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Abrir menú" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/[.06]">
            <List size={20} />
          </button>
          <img src="/images/brand/ninjasoft-logo-dark.webp" alt="Ninja Soft" width={640} height={145} className="h-6 w-auto" />
          <span className="ml-auto">
            <Avatar name={name} size={30} />
          </span>
        </header>
        <main className="ix-bg flex min-h-0 flex-1 flex-col">
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</div>
          <footer className="border-t border-white/10">
            <div className="ix-muted mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-[12px] sm:px-6">
              <span className="flex items-center gap-2">
                <img src="/images/brand/ninja-isotipo-flame.webp" alt="" width={240} height={311} className="h-4 w-auto" />
                © <Year initial={new Date().getFullYear()} /> Ninja Soft · Panel interno
              </span>
              <span className="flex gap-4">
                <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Sitio
                </a>
                <a href="https://pos.soft.ninja/internal" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  NinjaPOS
                </a>
                <a href="https://food.soft.ninja/internal" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Ninja Food
                </a>
              </span>
            </div>
          </footer>
        </main>
      </div>

      {pwOpen && <ChangePassword onClose={() => setPwOpen(false)} />}
    </div>
  );
}

function ChangePassword({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Usá al menos 8 caracteres.");
    if (password !== repeat) return setError("Las contraseñas no coinciden.");
    setBusy(true);
    const { error: err } = await internalClient().auth.updateUser({ password });
    setBusy(false);
    if (err) return setError("No pudimos cambiarla. Probá de nuevo.");
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="ix-fade absolute inset-0 bg-black/60" />
      <form onSubmit={submit} className="ix-card ix-fade relative grid w-full max-w-sm gap-4 bg-[#15103a] p-6">
        <p className="text-[18px] font-bold">Cambiar contraseña</p>
        {done ? (
          <>
            <p className="text-[#6ee7b7]">Listo, tu contraseña se actualizó.</p>
            <button type="button" onClick={onClose} className="ix-btn ix-btn-primary">
              Cerrar
            </button>
          </>
        ) : (
          <>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña nueva" autoComplete="new-password" className="ix-input" />
            <input type="password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} placeholder="Repetila" autoComplete="new-password" className="ix-input" />
            {error && <p className="text-[14px] text-[#fca5a5]">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="ix-btn">
                Cancelar
              </button>
              <button type="submit" disabled={busy} className="ix-btn ix-btn-primary">
                {busy ? <Spinner size={16} /> : "Guardar"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
