"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { functionError } from "@/lib/supabase/functionError";
import { PageHeader } from "./ui";

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "notify_email", label: "Emails de aviso", hint: "Dónde te llegan los contactos. Podés poner varios separados por coma." },
  { key: "sender", label: "Remitente", hint: 'Ej.: Ninja Soft <hola@soft.ninja> (dominio verificado en Resend).' },
  { key: "telegram_group_id", label: "ID del grupo de Telegram" },
  { key: "wait_minutes", label: "Minutos hasta el aviso de espera" },
  { key: "away_minutes", label: "Minutos sin actividad para responder por email" },
  { key: "site_url", label: "URL del sitio" },
  { key: "pos_internal_url", label: "URL internal NinjaPOS" },
  { key: "food_internal_url", label: "URL internal Ninja Food" },
  { key: "logo_soft_url", label: "Logo Ninja Soft · fondo oscuro", hint: "Variable {{logo_soft}}." },
  { key: "logo_pos_url", label: "Logo NinjaPOS · fondo oscuro", hint: "Variable {{logo_pos}}." },
  { key: "logo_food_url", label: "Logo Ninja Food · fondo oscuro", hint: "Variable {{logo_food}}." },
  { key: "logo_soft_claro_url", label: "Logo Ninja Soft · fondo claro", hint: "Variable {{logo_soft_claro}}." },
  { key: "logo_pos_claro_url", label: "Logo NinjaPOS · fondo claro", hint: "Variable {{logo_pos_claro}}." },
  { key: "logo_food_claro_url", label: "Logo Ninja Food · fondo claro", hint: "Variable {{logo_food_claro}}." },
];

export function SettingsTab({ sb }: { sb: SupabaseClient }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [secrets, setSecrets] = useState<Record<string, string | null>>({});
  const [draft, setDraft] = useState({ telegram_bot_token: "", resend_api_key: "" });
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(action: string, extra: Record<string, unknown> = {}) {
    const { data, error } = await sb.functions.invoke("admin-settings", { body: { action, ...extra } });
    if (error) throw new Error(await functionError(error, "Error inesperado."));
    return data as Record<string, unknown>;
  }

  async function run(label: string, fn: () => Promise<unknown>) {
    setNote(null);
    try {
      await fn();
      setNote({ ok: true, text: label });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : "Error inesperado." });
    }
  }

  useEffect(() => {
    sb.from("app_settings")
      .select("key,value")
      .then(({ data }) => setValues(Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))));
    call("get").then((d) => setSecrets(d.secrets as Record<string, string | null>)).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb]);

  const saveSettings = () =>
    run("Ajustes guardados.", async () => {
      const rows = FIELDS.map((f) => ({ key: f.key, value: (values[f.key] ?? "").trim(), updated_at: new Date().toISOString() }));
      const { error } = await sb.from("app_settings").upsert(rows);
      if (error) throw new Error(error.message);
    });

  const saveSecret = (name: "telegram_bot_token" | "resend_api_key") =>
    run("Clave guardada.", async () => {
      const d = await call("set_secret", { name, value: draft[name] });
      setSecrets((s) => ({ ...s, [name]: d.masked as string }));
      setDraft((x) => ({ ...x, [name]: "" }));
    });

  return (
    <div>
      <PageHeader eyebrow="Plataforma" title="Configuración" desc="Telegram, Resend, emails de aviso, tiempos del chat y logos de cada marca." />
      <div className="grid gap-6">
      {note && (
        <p role="status" className={`rounded-[14px] px-4 py-3 text-[14px] ${note.ok ? "border border-emerald-400/20 bg-emerald-400/[.06] text-[#6ee7b7]" : "border border-red-400/20 bg-red-400/[.06] text-[#fca5a5]"}`}>
          {note.text}
        </p>
      )}

      <section className="ix-card grid gap-4 p-6">
        <h2 className="text-[20px] font-bold">Claves</h2>
        {(
          [
            ["telegram_bot_token", "Token del bot de Telegram"],
            ["resend_api_key", "API key de Resend"],
          ] as const
        ).map(([name, label]) => (
          <div key={name} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-1 text-[14px]">
              <span>
                {label} <span className="ix-muted">· actual: {secrets[name] ?? "sin cargar"}</span>
              </span>
              <input
                type="password"
                autoComplete="off"
                value={draft[name]}
                onChange={(e) => setDraft((x) => ({ ...x, [name]: e.target.value }))}
                placeholder="Pegá el nuevo valor"
                className="ix-input"
              />
            </label>
            <button type="button" disabled={!draft[name].trim()} onClick={() => saveSecret(name)} className="ix-btn ix-btn-primary disabled:opacity-50">
              Guardar
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => run("Webhook de Telegram registrado.", () => call("register_webhook"))} className="ix-btn">
            Registrar webhook
          </button>
          <button type="button" onClick={() => run("Mensaje de prueba enviado a Telegram.", () => call("test_telegram"))} className="ix-btn">
            Probar Telegram
          </button>
          <button type="button" onClick={() => run("Email de prueba enviado.", () => call("test_resend"))} className="ix-btn">
            Probar email
          </button>
        </div>
      </section>

      <section className="ix-card grid gap-4 p-6">
        <h2 className="text-[20px] font-bold">Ajustes</h2>
        {FIELDS.map((f) => (
          <label key={f.key} className="grid gap-1 text-[14px]">
            <span>{f.label}</span>
            <input value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} className="ix-input" />
            {f.hint && <span className="text-[12px] ix-muted">{f.hint}</span>}
          </label>
        ))}
        <button type="button" onClick={saveSettings} className="ix-btn ix-btn-primary justify-self-start">
          Guardar ajustes
        </button>
      </section>
      </div>
    </div>
  );
}
