"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AddressBook, ArrowRight, ArrowSquareOut, ChatsCircle, Eye, HourglassMedium, UsersThree } from "@phosphor-icons/react";
import { axisStyle, EChart } from "./EChart";
import type { Stats } from "./StatsTab";
import { Avatar, Kpi, PageHeader, SpinnerBlock, timeAgo } from "./ui";

type ChatRow = { id: string; name: string; last_body: string | null; last_sender: string | null; last_media: boolean; last_at: string };

export function HomeTab({ sb, onGo }: { sb: SupabaseClient; onGo: (k: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chats, setChats] = useState<ChatRow[] | null>(null);
  const [links, setLinks] = useState({ pos: "", food: "" });

  useEffect(() => {
    sb.rpc("internal_stats", { p_days: 14 }).then(({ data }) => setStats(data as Stats));
    sb.rpc("internal_chat_list").then(({ data }) => setChats((data ?? []) as ChatRow[]));
    sb.from("app_settings")
      .select("key,value")
      .in("key", ["pos_internal_url", "food_internal_url"])
      .then(({ data }) => {
        const m = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
        setLinks({ pos: m.pos_internal_url ?? "", food: m.food_internal_url ?? "" });
      });
  }, [sb]);

  const waiting = (chats ?? []).filter((c) => c.last_sender === "visitor").length;
  const today = stats?.daily[stats.daily.length - 1];

  const option = useMemo(
    () =>
      stats && {
        grid: { left: 8, right: 8, top: 16, bottom: 4, containLabel: true },
        tooltip: { trigger: "axis" as const },
        xAxis: { type: "category" as const, data: stats.daily.map((d) => d.d.slice(5).split("-").reverse().join("/")), ...axisStyle, splitLine: { show: false } },
        yAxis: { type: "value" as const, minInterval: 1, ...axisStyle },
        series: [
          {
            name: "Visitantes",
            type: "line" as const,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 3 },
            areaStyle: {
              color: {
                type: "linear" as const,
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "rgba(255,106,26,.35)" },
                  { offset: 1, color: "rgba(255,106,26,0)" },
                ],
              },
            },
            data: stats.daily.map((d) => d.visitors),
          },
        ],
      },
    [stats],
  );

  return (
    <div>
      <PageHeader eyebrow="Panel interno" title="Inicio" desc="Lo importante de hoy: visitas, conversaciones y contactos." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Eye} label="Visitantes hoy" value={stats ? today?.visitors ?? 0 : "—"} sub={stats ? `${stats.totals.visitors} en 14 días` : undefined} />
        <Kpi icon={HourglassMedium} label="Chats esperando" value={chats ? waiting : "—"} sub="El último mensaje es del visitante" tone={waiting ? "#fcd34d" : undefined} />
        <Kpi icon={AddressBook} label="Contactos" value={stats ? stats.totals.contacts : "—"} sub={stats ? `+${stats.totals.contacts_new} en 14 días` : undefined} />
        <Kpi icon={UsersThree} label="Suscriptos" value={stats ? stats.totals.subscribed : "—"} sub="Reciben campañas" tone="#6ee7b7" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="ix-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">Visitantes · últimos 14 días</h2>
            <button type="button" onClick={() => onGo("estadisticas")} className="flex items-center gap-1 text-[13px] text-[#ff8a4c] hover:underline">
              Ver estadísticas <ArrowRight size={14} />
            </button>
          </div>
          {option ? <EChart option={option} height={220} /> : <SpinnerBlock />}
        </section>

        <section className="ix-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-bold">
              <ChatsCircle size={16} className="ix-muted" /> Últimos chats
            </h2>
            <button type="button" onClick={() => onGo("chats")} className="flex items-center gap-1 text-[13px] text-[#ff8a4c] hover:underline">
              Ver todos <ArrowRight size={14} />
            </button>
          </div>
          {!chats ? (
            <SpinnerBlock />
          ) : !chats.length ? (
            <p className="ix-muted py-8 text-center text-[14px]">Todavía no hay chats.</p>
          ) : (
            <ul className="grid gap-1">
              {chats.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => onGo("chats")} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/[.04]">
                    <Avatar name={c.name} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <b className="truncate text-[14px] font-semibold">{c.name}</b>
                        <span className="ix-muted shrink-0 text-[11px]">{timeAgo(c.last_at)}</span>
                      </span>
                      <span className="ix-muted block truncate text-[13px]">{c.last_media && !c.last_body ? "📷 Foto" : c.last_body ?? "—"}</span>
                    </span>
                    {c.last_sender === "visitor" && <i className="h-2 w-2 shrink-0 rounded-full bg-[#ff6a1a]" aria-label="Esperando respuesta" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <h2 className="mb-3 mt-8 text-[15px] font-bold">Paneles de los productos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { href: links.pos, logo: "/images/brand/ninjapos-logo-dark.webp", w: 640, h: 154, label: "Internal NinjaPOS" },
          { href: links.food, logo: "/images/brand/ninjafood-logo-dark.webp", w: 640, h: 142, label: "Internal Ninja Food" },
        ].map((c) => (
          <a key={c.label} href={c.href || undefined} target="_blank" rel="noopener noreferrer" className="ix-card group flex items-center justify-between gap-4 p-5 transition hover:bg-white/[.04]">
            <span>
              <img src={c.logo} alt="" width={c.w} height={c.h} className="h-7 w-auto" />
              <span className="ix-muted mt-2 block text-[13px]">{c.label}</span>
            </span>
            <ArrowSquareOut size={20} className="ix-muted transition group-hover:text-[#ff8a4c]" />
          </a>
        ))}
      </div>
    </div>
  );
}
