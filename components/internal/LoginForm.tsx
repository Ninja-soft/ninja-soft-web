"use client";

import { useState } from "react";
import { LockSimple } from "@phosphor-icons/react";
import { TechBackground } from "@/components/TechBackground";
import { internalClient } from "@/lib/supabase/client";

// Login del panel interno: misma estética que el acceso interno de NinjaPOS, sobre el fondo animado de la web.
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await internalClient().auth.signInWithPassword({ email, password });
    if (err) setError("Email o contraseña incorrectos.");
    setBusy(false);
  }

  return (
    <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-night px-4 py-12 text-snow">
      <TechBackground />
      <div className="relative z-10 w-full max-w-md">
        <img src="/images/brand/ninjasoft-logo-dark.webp" alt="Ninja Soft" width={640} height={145} className="mx-auto mb-8 h-14 w-auto sm:h-16" />
        <form onSubmit={submit} className="int-login grid gap-4 p-6 sm:p-7">
          <div className="text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,#ff4b22,#ff8a1f)] text-white">
              <LockSimple size={22} weight="fill" />
            </span>
            <h1 className="text-[22px] font-bold tracking-[-0.01em]">
              Panel <span className="text-alive">interno</span>
            </h1>
          </div>
          <label className="grid gap-1.5 text-[14px] text-mist">
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="int-login-input" />
          </label>
          <label className="grid gap-1.5 text-[14px] text-mist">
            Contraseña
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="int-login-input" />
          </label>
          {error && (
            <p role="alert" className="text-[14px] text-[#ff6961]">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="int-login-btn">
            {busy ? "Entrando…" : "Entrar al panel"}
          </button>
          <a href="/" className="text-center text-[14px] text-[#ff8a1f] hover:underline">
            Volver a soft.ninja
          </a>
        </form>
      </div>
    </main>
  );
}
