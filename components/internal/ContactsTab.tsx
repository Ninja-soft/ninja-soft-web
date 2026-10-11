"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AddressBook, DownloadSimple, EnvelopeSimple, MagnifyingGlass, MicrosoftTeamsLogo, Tray } from "@phosphor-icons/react";
import { Avatar, Empty, PageHeader, SpinnerBlock, timeAgo } from "./ui";

type Contact = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  business: string | null;
  sources: string[];
  created_at: string;
  last_seen_at: string;
  unsubscribed_at: string | null;
};
type Request = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  business: string | null;
  message: string;
  meeting: boolean;
  meeting_pref: string | null;
  status: string;
  created_at: string;
};

const SOURCE: Record<string, string> = { chat: "Chat", form: "Formulario" };

function toCsv(rows: Contact[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const head = ["Nombre", "Email", "Teléfono", "Empresa", "Rubro", "Origen", "Alta", "Estado"];
  const lines = rows.map((c) =>
    [c.name, c.email, c.phone ?? "", c.company ?? "", c.business ?? "", c.sources.map((s) => SOURCE[s] ?? s).join(" + "), new Date(c.created_at).toLocaleDateString("es-AR"), c.unsubscribed_at ? "De baja" : "Suscripto"]
      .map(esc)
      .join(","),
  );
  return "﻿" + [head.map(esc).join(","), ...lines].join("\n");
}

export function ContactsTab({ sb }: { sb: SupabaseClient }) {
  const [view, setView] = useState<"contactos" | "consultas">("contactos");
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [requests, setRequests] = useState<Request[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"todos" | "suscriptos" | "baja">("todos");
  const [source, setSource] = useState<"todos" | "chat" | "form">("todos");

  useEffect(() => {
    sb.from("contacts")
      .select("id,email,name,phone,company,business,sources,created_at,last_seen_at,unsubscribed_at")
      .order("created_at", { ascending: false })
      .limit(5000)
      .then(({ data }) => setContacts((data ?? []) as Contact[]));
    sb.from("contact_requests")
      .select("id,name,email,phone,company,business,message,meeting,meeting_pref,status,created_at")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => setRequests((data ?? []) as Request[]));
  }, [sb]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (contacts ?? []).filter(
      (c) =>
        (status === "todos" || (status === "baja" ? c.unsubscribed_at : !c.unsubscribed_at)) &&
        (source === "todos" || c.sources.includes(source)) &&
        (!t || [c.name, c.email, c.company ?? "", c.business ?? "", c.phone ?? ""].some((v) => v.toLowerCase().includes(t))),
    );
  }, [contacts, q, status, source]);

  async function toggleSub(c: Contact) {
    const value = c.unsubscribed_at ? null : new Date().toISOString();
    const { error } = await sb.from("contacts").update({ unsubscribed_at: value }).eq("id", c.id);
    if (!error) setContacts((cs) => cs?.map((x) => (x.id === c.id ? { ...x, unsubscribed_at: value } : x)) ?? null);
  }

  async function markDone(id: string) {
    const { error } = await sb.from("contact_requests").update({ status: "respondido" }).eq("id", id);
    if (!error) setRequests((rs) => rs?.map((r) => (r.id === id ? { ...r, status: "respondido" } : r)) ?? null);
  }

  function exportCsv() {
    const blob = new Blob([toCsv(shown)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contactos-ninja-soft-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const subs = (contacts ?? []).filter((c) => !c.unsubscribed_at).length;
  const pending = (requests ?? []).filter((r) => r.status === "nuevo").length;

  return (
    <div>
      <PageHeader
        eyebrow="Comercial"
        title="Contactos"
        desc="Todos los que escribieron por el chat o el formulario. Es tu base para remarketing y campañas."
        actions={
          view === "contactos" && (
            <button type="button" onClick={exportCsv} disabled={!shown.length} className="ix-btn">
              <DownloadSimple size={16} /> Exportar CSV
            </button>
          )
        }
      />

      <div className="mb-4 flex w-max gap-1 rounded-lg border border-white/10 bg-white/[.04] p-1">
        {(
          [
            ["contactos", `Contactos${contacts ? ` · ${contacts.length}` : ""}`],
            ["consultas", `Consultas del formulario${pending ? ` · ${pending} nuevas` : ""}`],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setView(k)} className={`rounded-md px-3 py-1.5 text-[13px] font-semibold ${view === k ? "bg-white/[.12] text-white" : "ix-muted hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {view === "contactos" ? (
        <section className="ix-card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
            <label className="relative min-w-[220px] flex-1">
              <MagnifyingGlass size={15} className="ix-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre, email, empresa…" className="ix-input pl-9" />
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="ix-input sm:w-52" aria-label="Estado">
              <option value="todos">Todos los estados</option>
              <option value="suscriptos">Suscriptos ({subs})</option>
              <option value="baja">De baja</option>
            </select>
            <select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className="ix-input sm:w-52" aria-label="Origen">
              <option value="todos">Todos los orígenes</option>
              <option value="chat">Chat</option>
              <option value="form">Formulario</option>
            </select>
          </div>
          {!contacts ? (
            <SpinnerBlock />
          ) : !shown.length ? (
            <Empty icon={AddressBook} title={contacts.length ? "Sin resultados" : "Todavía no hay contactos"} desc={contacts.length ? "Probá con otros filtros." : "Se crean solos cuando alguien escribe por el chat o el formulario."} />
          ) : (
            <div className="overflow-x-auto">
              <table className="ix-table min-w-[820px]">
                <thead>
                  <tr>
                    <th>Contacto</th>
                    <th>Empresa / rubro</th>
                    <th>Origen</th>
                    <th>Alta</th>
                    <th>Campañas</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name || c.email} size={34} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.name || "—"}</p>
                            <a href={`mailto:${c.email}`} className="ix-muted block truncate text-[12.5px] hover:text-white">
                              {c.email}
                            </a>
                            {c.phone && <p className="ix-muted text-[12px]">{c.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="ix-muted">
                        {c.company || "—"}
                        {c.business && <span className="block text-[12px]">{c.business}</span>}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {c.sources.map((s) => (
                            <span key={s} className="ix-pill bg-white/[.06] text-[#cfc7ef]">
                              {SOURCE[s] ?? s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="ix-muted text-[13px]">{timeAgo(c.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleSub(c)}
                          title={c.unsubscribed_at ? "Volver a suscribir" : "Dar de baja"}
                          className={`ix-pill ${c.unsubscribed_at ? "bg-red-400/10 text-[#fca5a5]" : "bg-emerald-400/10 text-[#6ee7b7]"}`}
                        >
                          {c.unsubscribed_at ? "De baja" : "Suscripto"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : !requests ? (
        <div className="ix-card">
          <SpinnerBlock />
        </div>
      ) : !requests.length ? (
        <div className="ix-card">
          <Empty icon={Tray} title="Sin consultas todavía" desc="Las consultas del formulario de la web aparecen acá." />
        </div>
      ) : (
        <ul className="grid gap-3">
          {requests.map((r) => (
            <li key={r.id} className="ix-card p-5">
              <div className="flex flex-wrap items-start gap-3">
                <Avatar name={r.name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{r.name}</b>
                    {r.status === "nuevo" ? <span className="ix-pill bg-[rgba(255,106,26,.15)] text-[#ff8a4c]">Nueva</span> : <span className="ix-pill bg-emerald-400/10 text-[#6ee7b7]">Respondida</span>}
                    {r.meeting && (
                      <span className="ix-pill bg-[#5b5fc7]/20 text-[#b8baff]">
                        <MicrosoftTeamsLogo size={13} weight="fill" /> Reunión{r.meeting_pref ? ` · ${r.meeting_pref}` : ""}
                      </span>
                    )}
                    <span className="ix-muted ml-auto text-[12px]">{new Date(r.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
                  </div>
                  <p className="ix-muted mt-0.5 text-[13px]">
                    {r.email}
                    {r.phone && ` · ${r.phone}`}
                    {r.company && ` · ${r.company}`}
                    {r.business && ` · ${r.business}`}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed">{r.message}</p>
                  <div className="mt-4 flex gap-2">
                    <a href={`mailto:${r.email}`} className="ix-btn h-9 px-3 text-[13px]">
                      <EnvelopeSimple size={15} /> Responder
                    </a>
                    {r.status === "nuevo" && (
                      <button type="button" onClick={() => markDone(r.id)} className="ix-btn h-9 px-3 text-[13px]">
                        Marcar respondida
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
