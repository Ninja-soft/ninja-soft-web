"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { brandVars, formatDate, renderTemplate, TEMPLATE_VARS, type TemplateData } from "@/supabase/functions/_shared/template";
import { PageHeader } from "./ui";

type Tpl = { key: string; subject: string; html: string };
const NAMES: Record<string, string> = {
  contact_ack: "Auto-respuesta al cliente",
  contact_notify: "Aviso de nuevo contacto (a vos)",
  chat_reply: "Respuesta del chat por email",
};
const SAMPLE: TemplateData = {
  nombre: "Juan Pérez",
  email: "juan@ejemplo.com",
  telefono: "+54 9 341 555 1234",
  rubro: "Kiosco / almacén",
  mensaje: "Hola, quiero saber cómo funciona NinjaPOS para mi kiosco.",
  respuesta: "¡Hola Juan! Te cuento: NinjaPOS funciona en cualquier celular o tablet…",
  link_sitio: typeof window === "undefined" ? "" : window.location.origin,
};

export function TemplatesTab({ sb }: { sb: SupabaseClient }) {
  const [tpls, setTpls] = useState<Tpl[]>([]);
  const [sel, setSel] = useState("contact_ack");
  const [note, setNote] = useState<string | null>(null);
  const [brand, setBrand] = useState<TemplateData>({});

  useEffect(() => {
    sb.from("email_templates")
      .select("key,subject,html")
      .order("key")
      .then(({ data }) => setTpls((data ?? []) as Tpl[]));
    sb.from("app_settings")
      .select("key,value")
      .then(({ data }) => setBrand(brandVars(Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])))));
  }, [sb]);

  const cur = tpls.find((t) => t.key === sel);
  const preview = useMemo(() => (cur ? renderTemplate(cur.html, { ...SAMPLE, ...brand, fecha: formatDate(Date.now()) }) : ""), [cur, brand]);
  const edit = (patch: Partial<Tpl>) => setTpls((ts) => ts.map((t) => (t.key === sel ? { ...t, ...patch } : t)));

  async function save() {
    if (!cur) return;
    const { error } = await sb
      .from("email_templates")
      .update({ subject: cur.subject, html: cur.html, updated_at: new Date().toISOString() })
      .eq("key", cur.key);
    setNote(error ? `Error: ${error.message}` : "Plantilla guardada.");
  }

  return (
    <div>
      <PageHeader eyebrow="Comunicaciones" title="Plantillas" desc="Los emails automáticos que salen del sitio. Editá el HTML y mirá la vista previa en vivo." />
      <div className="grid gap-4">
      <div className="flex w-max max-w-full gap-1 overflow-x-auto rounded-full bg-white/[.04] p-1">
        {tpls.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setSel(t.key);
              setNote(null);
            }}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[14px] font-medium ${sel === t.key ? "bg-white/[.12] text-white" : "ix-muted"}`}
          >
            {NAMES[t.key] ?? t.key}
          </button>
        ))}
      </div>
      {cur && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="ix-card grid gap-3 p-5">
            <label className="grid gap-1 text-[14px]">
              Asunto
              <input value={cur.subject} onChange={(e) => edit({ subject: e.target.value })} className="ix-input" />
            </label>
            <label className="grid gap-1 text-[14px]">
              HTML
              <textarea value={cur.html} onChange={(e) => edit({ html: e.target.value })} rows={18} spellCheck={false} className="ix-input font-mono text-[13px]" />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARS.map((v) => (
                <button key={v} type="button" onClick={() => navigator.clipboard?.writeText(`{{${v}}}`)} className="rounded-full bg-white/[.06] px-2.5 py-1 font-mono text-[12px]" title="Copiar">
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={save} className="ix-btn ix-btn-primary">
                Guardar
              </button>
              {note && <span className="text-[13px] ix-muted">{note}</span>}
            </div>
          </div>
          <div className="ix-card overflow-hidden">
            <p className="border-b border-white/10 px-4 py-2 text-[13px] ix-muted">
              Vista previa · {renderTemplate(cur.subject, SAMPLE, { html: false })}
            </p>
            <iframe title="Vista previa" sandbox="" srcDoc={preview} className="h-[560px] w-full bg-white" />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
