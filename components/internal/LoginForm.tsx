"use client";

import { useState } from "react";
import { EnvelopeSimple, Key, LockSimple } from "@phosphor-icons/react";
import { TechBackground } from "@/components/TechBackground";
import { internalClient } from "@/lib/supabase/client";

// Pantallas de acceso del panel interno: misma estética que el acceso interno de NinjaPOS,
// sobre el fondo animado de la web.
export function AuthShell({ icon, title, children }: { icon: React.ReactNode; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="int-auth-bg relative isolate grid min-h-screen place-items-center overflow-hidden px-4 py-12 text-snow">
      <TechBackground />
      <div className="relative z-10 w-full max-w-md">
        <img src="/images/brand/ninjasoft-logo-dark.webp" alt="Ninja Soft" width={640} height={145} className="mx-auto mb-8 h-14 w-auto sm:h-16" />
        <div className="int-login grid gap-4 p-6 sm:p-7">
          <div className="text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,#ff4b22,#ff8a1f)] text-white">{icon}</span>
            <h1 className="text-[22px] font-bold tracking-[-0.01em]">{title}</h1>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

const resetUrl = () => `${window.location.origin}/internal?setpw=1`;

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "forgot" | "sent">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (mode === "forgot") {
      const { error: err } = await internalClient().auth.resetPasswordForEmail(email, { redirectTo: resetUrl() });
      if (err) setError("No pudimos enviar el email. Probá de nuevo en unos minutos.");
      else setMode("sent");
    } else {
      const { error: err } = await internalClient().auth.signInWithPassword({ email, password });
      if (err) setError("Email o contraseña incorrectos.");
    }
    setBusy(false);
  }

  if (mode === "sent") {
    return (
      <AuthShell icon={<EnvelopeSimple size={22} weight="fill" />} title="Revisá tu email">
        <p className="text-center text-[14.5px] leading-snug text-mist">
          Si <b className="text-snow">{email}</b> tiene acceso, te llega un link para elegir una contraseña nueva.
        </p>
        <button type="button" onClick={() => setMode("login")} className="text-center text-[14px] text-[#ff8a1f] hover:underline">
          Volver a iniciar sesión
        </button>
      </AuthShell>
    );
  }

  const forgot = mode === "forgot";
  return (
    <AuthShell
      icon={forgot ? <Key size={22} weight="fill" /> : <LockSimple size={22} weight="fill" />}
      title={
        forgot ? (
          "Recuperar contraseña"
        ) : (
          <>
            Panel <span className="text-alive">interno</span>
          </>
        )
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5 text-[14px] text-mist">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="int-login-input" />
        </label>
        {!forgot && (
          <label className="grid gap-1.5 text-[14px] text-mist">
            Contraseña
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="int-login-input" />
          </label>
        )}
        {error && (
          <p role="alert" className="text-[14px] text-[#ff6961]">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="int-login-btn">
          {busy ? "Un momento…" : forgot ? "Enviarme el link" : "Entrar al panel"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(forgot ? "login" : "forgot");
            setError(null);
          }}
          className="text-center text-[14px] text-[#ff8a1f] hover:underline"
        >
          {forgot ? "Volver a iniciar sesión" : "Olvidé mi contraseña"}
        </button>
        <a href="/" className="-mt-1 text-center text-[13px] text-mist hover:text-snow">
          ← Volver al sitio web
        </a>
      </form>
    </AuthShell>
  );
}

// Al entrar desde una invitación o un link de recuperación: elegir la contraseña.
export function SetPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Usá al menos 8 caracteres.");
    if (password !== repeat) return setError("Las contraseñas no coinciden.");
    setBusy(true);
    const { error: err } = await internalClient().auth.updateUser({ password });
    setBusy(false);
    if (err) return setError("No pudimos guardar la contraseña. Pedí un link nuevo.");
    onDone();
  }

  return (
    <AuthShell icon={<Key size={22} weight="fill" />} title="Elegí tu contraseña">
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5 text-[14px] text-mist">
          Contraseña nueva
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="int-login-input" />
        </label>
        <label className="grid gap-1.5 text-[14px] text-mist">
          Repetila
          <input type="password" required minLength={8} value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" className="int-login-input" />
        </label>
        {error && (
          <p role="alert" className="text-[14px] text-[#ff6961]">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="int-login-btn">
          {busy ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </AuthShell>
  );
}
