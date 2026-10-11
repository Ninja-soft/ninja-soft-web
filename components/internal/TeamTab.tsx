"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PaperPlaneTilt, UserMinus } from "@phosphor-icons/react";
import { functionError } from "@/lib/supabase/functionError";
import { Avatar, PageHeader } from "./ui";

type Member = { user_id: string; email: string; created_at: string; last_sign_in_at: string | null; confirmed: boolean };

// Equipo del panel: invitar por email (llega un link para elegir contraseña) y quitar accesos.
export function TeamTab({ sb }: { sb: SupabaseClient }) {
  const [team, setTeam] = useState<Member[] | null>(null);
  const [me, setMe] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const call = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const { data, error } = await sb.functions.invoke("admin-settings", { body: { action, ...extra } });
      if (error) throw new Error(await functionError(error, "Error inesperado."));
      return data as Record<string, unknown>;
    },
    [sb],
  );

  const load = useCallback(async () => {
    const d = await call("team_list");
    setTeam(d.team as Member[]);
    setMe(d.me as string);
  }, [call]);

  useEffect(() => {
    load().catch((e) => setNote({ ok: false, text: e.message }));
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const d = await call("invite", { email, redirect: `${window.location.origin}/internal` });
      setNote({ ok: true, text: d.existed ? `${email} ya tenía cuenta: le diste acceso al panel.` : `Invitación enviada a ${email}.` });
      setEmail("");
      await load();
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : "Error inesperado." });
    }
    setBusy(false);
  }

  async function remove(m: Member) {
    setConfirmId(null);
    try {
      await call("remove_admin", { user_id: m.user_id });
      await load();
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : "Error inesperado." });
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Plataforma" title="Equipo" desc="Quiénes pueden entrar al panel. Invitá por email y quitá accesos cuando haga falta." />
      <div className="grid gap-6">
      <form onSubmit={invite} className="ix-card grid gap-3 p-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-1 text-[14px]">
          <span className="text-[20px] font-bold">Invitar al equipo</span>
          <span className="mb-2 text-[13px] ix-muted">Le llega un email para elegir su contraseña y entrar al panel.</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@empresa.com" className="ix-input" />
        </label>
        <button type="submit" disabled={busy} className="ix-btn ix-btn-primary disabled:opacity-60">
          <PaperPlaneTilt size={18} weight="fill" />
          {busy ? "Enviando…" : "Invitar"}
        </button>
      </form>

      {note && (
        <p role="status" className={`rounded-[14px] px-4 py-3 text-[14px] ${note.ok ? "border border-emerald-400/20 bg-emerald-400/[.06] text-[#6ee7b7]" : "border border-red-400/20 bg-red-400/[.06] text-[#fca5a5]"}`}>
          {note.text}
        </p>
      )}

      <section className="ix-card overflow-hidden">
        <h2 className="px-6 pb-2 pt-5 text-[13px] font-semibold uppercase tracking-[.12em] ix-muted">Con acceso</h2>
        {!team ? (
          <div className="grid place-items-center py-10">
            <span role="status" aria-label="Cargando" className="ix-spinner" style={{ width: 26, height: 26 }} />
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {team.map((m) => (
              <li key={m.user_id} className="flex items-center gap-3 px-6 py-4">
                <Avatar name={m.email} size={40} />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[15px]">
                    {m.email} {m.user_id === me && <span className="text-[13px] font-normal ix-muted">(vos)</span>}
                  </b>
                  <span className="text-[13px] ix-muted">
                    {m.last_sign_in_at
                      ? `Último ingreso: ${new Date(m.last_sign_in_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}`
                      : "Invitación pendiente"}
                  </span>
                </span>
                {m.user_id !== me && confirmId === m.user_id && (
                  <span className="flex items-center gap-1.5">
                    <span className="hidden text-[13px] ix-muted sm:inline">¿Quitar acceso?</span>
                    <button type="button" onClick={() => setConfirmId(null)} className="rounded-full px-3 py-1.5 text-[13px] font-semibold ix-muted hover:bg-white/[.04]">
                      Cancelar
                    </button>
                    <button type="button" onClick={() => remove(m)} className="rounded-full bg-[#c2352b] px-3 py-1.5 text-[13px] font-semibold text-white">
                      Quitar
                    </button>
                  </span>
                )}
                {m.user_id !== me && confirmId !== m.user_id && (
                  <button type="button" onClick={() => setConfirmId(m.user_id)} aria-label={`Quitar a ${m.email}`} className="grid h-9 w-9 place-items-center rounded-full ix-muted hover:bg-red-400/10 hover:text-[#fca5a5]">
                    <UserMinus size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}
