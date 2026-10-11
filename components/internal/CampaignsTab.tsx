"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowClockwise, FloppyDisk, Flask, Megaphone, PaperPlaneTilt, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { functionError } from "@/lib/supabase/functionError";
import { brandVars, renderTemplate, type TemplateData } from "@/supabase/functions/_shared/template";
import { Empty, Note, PageHeader, Spinner, SpinnerBlock } from "./ui";

type Campaign = { id: string; subject: string; html: string; status: "draft" | "sending" | "done"; total: number; sent: number; failed: number; created_at: string; finished_at: string | null };

const BASE_HTML = `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#f3f2f8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f2f8"><tr><td align="center" style="padding:28px 12px 40px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<tr><td style="background:#09051C;border-radius:20px 20px 0 0;padding:32px;text-align:center"><img src="{{logo_soft}}" alt="Ninja Soft" height="32" style="display:block;margin:0 auto;height:32px;border:0"></td></tr>
<tr><td style="background:#ffffff;padding:40px 40px 8px">
<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#ff5a1f">Novedades</p>
<h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;font-weight:800;color:#09051C">Hola {{nombre}}, tenemos algo para tu negocio</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#4b5563">Escribí acá el mensaje de la campaña: una promo, una función nueva de NinjaPOS o una invitación.</p>
</td></tr>
<tr><td style="background:#ffffff;padding:16px 40px 44px;text-align:center;border-radius:0 0 20px 20px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="border-radius:999px;background:#ff5a1f;background-image:linear-gradient(135deg,#ff4b22,#ff8a1f)"><a href="{{link_sitio}}" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none">Conocé más</a></td></tr></table>
</td></tr>
<tr><td style="padding:24px;text-align:center;font-size:12px;line-height:1.6;color:#9ca3af">
<img src="{{logo_soft_claro}}" alt="Ninja Soft" height="20" style="display:block;margin:0 auto 10px;height:20px;border:0">
Ninja Soft · Urquiza 3164, Rosario, Santa Fe, Argentina<br>
Recibís este email porque nos escribiste desde nuestro sitio. <a href="{{link_baja}}" style="color:#9ca3af">Darme de baja</a>
</td></tr>
</table></td></tr></table></body></html>`;

export function CampaignsTab({ sb }: { sb: SupabaseClient }) {
  const [list, setList] = useState<Campaign[] | null>(null);
  const [subs, setSubs] = useState<number | null>(null);
  const [brand, setBrand] = useState<TemplateData>({});
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState("Novedades de Ninja Soft para {{nombre}}");
  const [html, setHtml] = useState(BASE_HTML);
  const [busy, setBusy] = useState<"" | "test" | "send" | "save">("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const call = useCallback(
    async (action: string, extra: Record<string, unknown>) => {
      const { data, error } = await sb.functions.invoke("campaign", { body: { action, ...extra } });
      if (error) throw new Error(await functionError(error, "Error inesperado."));
      return data as Record<string, unknown>;
    },
    [sb],
  );

  const load = useCallback(() => {
    sb.from("campaigns")
      .select("id,subject,html,status,total,sent,failed,created_at,finished_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setList((data ?? []) as Campaign[]));
    sb.from("contacts")
      .select("id", { count: "exact", head: true })
      .is("unsubscribed_at", null)
      .then(({ count }) => setSubs(count ?? 0));
  }, [sb]);

  useEffect(() => {
    load();
    sb.from("app_settings")
      .select("key,value")
      .then(({ data }) => {
        const m = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
        setBrand({ ...brandVars(m), link_sitio: m.site_url });
      });
  }, [sb, load]);

  const preview = useMemo(() => renderTemplate(html, { ...brand, nombre: "Juan", email: "juan@ejemplo.com", link_baja: "#" }), [html, brand]);

  function openEditor(c?: Campaign) {
    setDraftId(c?.id ?? null);
    setSubject(c?.subject ?? "Novedades de Ninja Soft para {{nombre}}");
    setHtml(c?.html ?? BASE_HTML);
    setConfirm(false);
    setNote(null);
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDraft() {
    setBusy("save");
    setNote(null);
    const now = new Date().toISOString();
    const { data, error } = draftId
      ? await sb.from("campaigns").update({ subject, html, updated_at: now }).eq("id", draftId).select("id").single()
      : await sb.from("campaigns").insert({ subject, html, status: "draft" }).select("id").single();
    if (error) setNote({ ok: false, text: `No se pudo guardar: ${error.message}` });
    else {
      setDraftId(data.id);
      setNote({ ok: true, text: "Borrador guardado." });
      load();
    }
    setBusy("");
  }

  async function removeDraft(id: string) {
    setDelId(null);
    const { error } = await sb.from("campaigns").delete().eq("id", id).eq("status", "draft");
    if (error) setNote({ ok: false, text: error.message });
    else {
      if (draftId === id) setEditing(false);
      load();
    }
  }

  async function sendTest() {
    setBusy("test");
    setNote(null);
    try {
      const d = await call("test", { subject, html });
      setNote({ ok: true, text: `Te mandamos la prueba a ${String(d.to)}.` });
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Error" });
    }
    setBusy("");
  }

  // Envía los pendientes de a 100 hasta terminar; se puede reanudar si se corta.
  async function runBatches(id: string) {
    setBusy("send");
    try {
      for (;;) {
        const d = await call("send_batch", { id });
        setProgress((p) => ({ total: p?.total ?? Number(d.sent) + Number(d.failed) + Number(d.remaining), sent: Number(d.sent), failed: Number(d.failed) }));
        if (!Number(d.remaining)) break;
      }
      setNote({ ok: true, text: "Campaña enviada." });
    } catch (e) {
      setNote({ ok: false, text: `${e instanceof Error ? e.message : "Error"} · Podés reanudarla desde el historial.` });
    }
    setBusy("");
    load();
  }

  async function start() {
    setConfirm(false);
    setNote(null);
    setBusy("send");
    try {
      const d = await call("start", { subject, html, draft_id: draftId });
      setProgress({ total: Number(d.total), sent: 0, failed: 0 });
      await runBatches(String(d.id));
      setEditing(false);
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Error" });
      setBusy("");
    }
  }

  async function resume(c: Campaign) {
    setProgress({ total: c.total, sent: c.sent, failed: c.failed });
    await runBatches(c.id);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Comercial"
        title="Campañas"
        desc="Emails a toda tu base de contactos con la marca de Ninja Soft. Cada email lleva su link de baja."
        actions={
          !editing && (
            <button type="button" onClick={() => openEditor()} className="ix-btn ix-btn-primary">
              <Plus size={16} weight="bold" /> Nueva campaña
            </button>
          )
        }
      />

      <div className="grid gap-4">
        <Note note={note} />

        {progress && busy === "send" && (
          <div className="ix-card p-5">
            <div className="mb-2 flex items-center justify-between text-[14px]">
              <span className="flex items-center gap-2 font-semibold">
                <Spinner size={16} /> Enviando campaña…
              </span>
              <span className="ix-muted">
                {progress.sent + progress.failed} / {progress.total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[.08]">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#ff4b22,#ff8a1f)] transition-[width] duration-500" style={{ width: `${progress.total ? ((progress.sent + progress.failed) / progress.total) * 100 : 0}%` }} />
            </div>
            <p className="ix-muted mt-2 text-[12.5px]">No cierres esta pestaña hasta que termine. Si se corta, la reanudás sin duplicar envíos.</p>
          </div>
        )}

        {editing && (
          <section className="ix-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-bold">{draftId ? "Editar borrador" : "Nueva campaña"}</h2>
              <button type="button" onClick={() => setEditing(false)} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/[.06]">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid content-start gap-3">
                <label className="grid gap-1.5 text-[13px] font-medium">
                  <span className="ix-muted">Asunto</span>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} className="ix-input" />
                </label>
                <label className="grid gap-1.5 text-[13px] font-medium">
                  <span className="ix-muted">Contenido (HTML)</span>
                  <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={20} spellCheck={false} className="ix-input font-mono text-[12.5px]" />
                </label>
                <p className="ix-muted text-[12.5px]">
                  Variables: <code>{"{{nombre}}"}</code> <code>{"{{email}}"}</code> <code>{"{{link_sitio}}"}</code> <code>{"{{link_baja}}"}</code> <code>{"{{logo_soft}}"}</code>. Si sacás el link de baja, se agrega solo al pie.
                </p>
                <p className="rounded-lg border border-amber-300/20 bg-amber-300/[.06] px-3 py-2 text-[12.5px] text-[#fcd34d]">
                  Plan gratis de Resend: hasta 100 emails por día y 3.000 por mes. Para listas más grandes, pasá a un plan pago.
                </p>
                {confirm ? (
                  <div className="ix-fade rounded-lg border border-white/10 bg-white/[.04] p-4">
                    <p className="text-[14px]">
                      <b>¿Enviar a {subs ?? "…"} contactos suscriptos?</b>
                      <span className="ix-muted block">No se puede deshacer.</span>
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => setConfirm(false)} className="ix-btn">
                        Cancelar
                      </button>
                      <button type="button" onClick={start} className="ix-btn ix-btn-primary">
                        Sí, enviar ahora
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={saveDraft} disabled={!!busy} className="ix-btn">
                      {busy === "save" ? <Spinner size={16} /> : <FloppyDisk size={16} />} Guardar borrador
                    </button>
                    <button type="button" onClick={sendTest} disabled={!!busy} className="ix-btn">
                      {busy === "test" ? <Spinner size={16} /> : <Flask size={16} />} Enviarme una prueba
                    </button>
                    <button type="button" onClick={() => setConfirm(true)} disabled={!!busy || !subs} className="ix-btn ix-btn-primary">
                      <PaperPlaneTilt size={16} weight="fill" /> Enviar a {subs ?? "…"} suscriptos
                    </button>
                  </div>
                )}
              </div>
              <div className="overflow-hidden rounded-lg border border-white/10">
                <p className="ix-muted border-b border-white/10 bg-white/[.03] px-4 py-2 text-[12.5px]">Vista previa · {renderTemplate(subject, { nombre: "Juan" }, { html: false })}</p>
                <iframe title="Vista previa" sandbox="" srcDoc={preview} className="h-[620px] w-full bg-white" />
              </div>
            </div>
          </section>
        )}

        <section className="ix-card overflow-hidden">
          <h2 className="px-5 pb-3 pt-5 text-[15px] font-bold">Historial</h2>
          {!list ? (
            <SpinnerBlock />
          ) : !list.length ? (
            <Empty icon={Megaphone} title="Todavía no enviaste campañas" desc="Armá la primera con el botón “Nueva campaña”." />
          ) : (
            <div className="overflow-x-auto">
              <table className="ix-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>Campaña</th>
                    <th>Fecha</th>
                    <th className="text-right">Enviados</th>
                    <th className="text-right">Fallidos</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id}>
                      <td className="max-w-[320px] truncate font-medium">{c.subject}</td>
                      <td className="ix-muted text-[13px]">{new Date(c.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</td>
                      <td className="text-right">
                        {c.status === "draft" ? <span className="ix-muted">—</span> : <>{c.sent} <span className="ix-muted">/ {c.total}</span></>}
                      </td>
                      <td className="text-right">{c.failed ? <span className="text-[#fca5a5]">{c.failed}</span> : <span className="ix-muted">0</span>}</td>
                      <td>
                        {c.status === "draft" ? (
                          delId === c.id ? (
                            <span className="flex items-center gap-1.5">
                              <button type="button" onClick={() => setDelId(null)} className="ix-pill bg-white/[.06] text-[#cfc7ef]">
                                Cancelar
                              </button>
                              <button type="button" onClick={() => removeDraft(c.id)} className="ix-pill bg-red-400/15 text-[#fca5a5]">
                                Borrar
                              </button>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <span className="ix-pill bg-white/[.06] text-[#cfc7ef]">Borrador</span>
                              <button type="button" onClick={() => openEditor(c)} aria-label="Editar borrador" className="grid h-7 w-7 place-items-center rounded-md hover:bg-white/[.08]">
                                <PencilSimple size={15} />
                              </button>
                              <button type="button" onClick={() => setDelId(c.id)} aria-label="Borrar borrador" className="grid h-7 w-7 place-items-center rounded-md text-[#fca5a5] hover:bg-red-400/10">
                                <Trash size={15} />
                              </button>
                            </span>
                          )
                        ) : c.status === "done" ? (
                          <span className="ix-pill bg-emerald-400/10 text-[#6ee7b7]">Enviada</span>
                        ) : (
                          <button type="button" onClick={() => resume(c)} disabled={!!busy} className="ix-pill bg-amber-300/10 text-[#fcd34d] hover:bg-amber-300/20">
                            <ArrowClockwise size={13} /> Reanudar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
