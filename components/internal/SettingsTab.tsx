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

      {/* conexiones: una tarjeta por servicio, con su logo */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(
          [
            {
              name: "telegram_bot_token" as const,
              logo: "/images/integrations/telegram.webp",
              title: "Telegram",
              desc: "Bot que recibe los chats de la web y te deja responder desde el grupo.",
              label: "Token del bot",
              actions: [
                { text: "Registrar webhook", ok: "Webhook de Telegram registrado.", action: "register_webhook" },
                { text: "Probar Telegram", ok: "Mensaje de prueba enviado a Telegram.", action: "test_telegram" },
              ],
            },
            {
              name: "resend_api_key" as const,
              logo: "/images/integrations/resend.webp",
              title: "Resend",
              desc: "Envía los emails del sitio: avisos, respuestas automáticas y campañas.",
              label: "API key",
              actions: [{ text: "Probar email", ok: "Email de prueba enviado.", action: "test_resend" }],
            },
          ]
        ).map((svc) => (
          <section key={svc.name} className="ix-card grid content-start gap-4 p-6">
            <div className="flex items-center gap-3">
              <img src={svc.logo} alt="" width={160} height={160} className="h-11 w-11 rounded-[12px]" />
              <div className="min-w-0">
                <h2 className="text-[18px] font-bold">{svc.title}</h2>
                <p className="ix-muted text-[13px] leading-snug">{svc.desc}</p>
              </div>
              <span className={`ix-pill ml-auto shrink-0 ${secrets[svc.name] ? "bg-emerald-400/10 text-[#6ee7b7]" : "bg-amber-300/10 text-[#fcd34d]"}`}>
                {secrets[svc.name] ? "Conectado" : "Sin configurar"}
              </span>
            </div>
            <label className="grid gap-1.5 text-[13px]">
              <span className="ix-muted">
                {svc.label}
                {secrets[svc.name] && <span className="ml-1 font-mono">· actual {secrets[svc.name]}</span>}
              </span>
              <div className="flex gap-2">
                <input
                  type="password"
                  autoComplete="off"
                  value={draft[svc.name]}
                  onChange={(e) => setDraft((x) => ({ ...x, [svc.name]: e.target.value }))}
                  placeholder="Pegá el nuevo valor"
                  className="ix-input"
                />
                <button type="button" disabled={!draft[svc.name].trim()} onClick={() => saveSecret(svc.name)} className="ix-btn ix-btn-primary shrink-0">
                  Guardar
                </button>
              </div>
            </label>
            <div className="flex flex-wrap gap-2">
              {svc.actions.map((ac) => (
                <button key={ac.action} type="button" onClick={() => run(ac.ok, () => call(ac.action))} className="ix-btn h-9 px-3 text-[13px]">
                  {ac.text}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

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
