"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = { id: string; name: string; email: string; phone: string | null; business: string | null; message: string; status: string; created_at: string };

export function ContactsTab({ sb }: { sb: SupabaseClient }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    sb.from("contact_requests")
      .select("id,name,email,phone,business,message,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, [sb]);

  async function markDone(id: string) {
    const { error } = await sb.from("contact_requests").update({ status: "respondido" }).eq("id", id);
    if (!error) setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: "respondido" } : r)));
  }

  if (!rows.length) return <p className="text-[#86868b]">Todavía no hay contactos.</p>;

  return (
    <ul className="grid gap-3">
      {rows.map((r) => (
        <li key={r.id} className="int-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <b className="text-[16px]">{r.name}</b>
            <span className="text-[12px] text-[#86868b]">{new Date(r.created_at).toLocaleString("es-AR")}</span>
          </div>
          <p className="text-[14px] text-[#6e6e73]">
            <a href={`mailto:${r.email}`} className="underline">{r.email}</a>
            {r.phone && ` · ${r.phone}`}
            {r.business && ` · ${r.business}`}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[15px]">{r.message}</p>
          <div className="mt-3">
            {r.status === "nuevo" ? (
              <button type="button" onClick={() => markDone(r.id)} className="text-[14px] font-semibold text-flame-link">
                Marcar respondido
              </button>
            ) : (
              <span className="text-[13px] text-[#30a14e]">Respondido</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
