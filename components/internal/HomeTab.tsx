"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowUpRight } from "@phosphor-icons/react";

export function HomeTab({ sb }: { sb: SupabaseClient }) {
  const [links, setLinks] = useState<{ pos: string; food: string }>({ pos: "", food: "" });
  const [counts, setCounts] = useState({ chats: 0, contacts: 0 });

  useEffect(() => {
    sb.from("app_settings")
      .select("key,value")
      .in("key", ["pos_internal_url", "food_internal_url"])
      .then(({ data }) => {
        const m = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
        setLinks({ pos: m.pos_internal_url ?? "", food: m.food_internal_url ?? "" });
      });
    Promise.all([
      sb.from("chat_sessions").select("id", { count: "exact", head: true }).is("closed_at", null),
      sb.from("contact_requests").select("id", { count: "exact", head: true }).eq("status", "nuevo"),
    ]).then(([c, k]) => setCounts({ chats: c.count ?? 0, contacts: k.count ?? 0 }));
  }, [sb]);

  const cards = [
    { href: links.pos, logo: "/images/brand/ninjapos-logo-light.webp", w: 640, h: 154, label: "Internal NinjaPOS" },
    { href: links.food, logo: "/images/brand/ninjafood-logo-light.webp", w: 640, h: 142, label: "Internal Ninja Food" },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <a key={c.label} href={c.href || undefined} target="_blank" rel="noopener noreferrer" className="int-card group flex items-center justify-between gap-4 p-6">
            <span>
              <img src={c.logo} alt="" width={c.w} height={c.h} className="h-8 w-auto" />
              <span className="mt-3 block text-[14px] text-[#6e6e73]">{c.label}</span>
            </span>
            <ArrowUpRight size={22} className="text-[#86868b] transition group-hover:text-[#ff4b22]" />
          </a>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="int-card p-6">
          <p className="text-[13px] text-[#86868b]">Chats abiertos</p>
          <p className="mt-1 text-[34px] font-bold">{counts.chats}</p>
        </div>
        <div className="int-card p-6">
          <p className="text-[13px] text-[#86868b]">Contactos nuevos</p>
          <p className="mt-1 text-[34px] font-bold">{counts.contacts}</p>
        </div>
      </div>
    </div>
  );
}
