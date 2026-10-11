"use client";

import { useState } from "react";
import { internalClient } from "@/lib/supabase/client";

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
    <form onSubmit={submit} className="grid w-full max-w-[360px] gap-3">
      <h1 className="text-[28px] font-bold tracking-[-0.02em]">Panel interno</h1>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username" className="int-input" />
      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" autoComplete="current-password" className="int-input" />
      {error && <p role="alert" className="text-[14px] text-[#d70015]">{error}</p>}
      <button type="submit" disabled={busy} className="btn-flame justify-center disabled:opacity-60">
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
