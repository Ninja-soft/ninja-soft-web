"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ChartLineUp, ChatsCircle, CursorClick, Eye, Funnel, Mouse, PaperPlaneTilt, UsersThree } from "@phosphor-icons/react";
import { axisStyle, CHART_COLORS, EChart } from "./EChart";
import { Empty, Kpi, PageHeader, SpinnerBlock } from "./ui";

export type Stats = {
  daily: { d: string; views: number; visitors: number; chats: number; contacts: number }[];
  totals: {
    views: number;
    visitors: number;
    chat_open: number;
    chat_msg: number;
    forms: number;
    cta: number;
    contacts: number;
    contacts_new: number;
    subscribed: number;
    avg_scroll: number;
  };
  sources: { name: string; visitors: number }[];
  campaigns: { name: string; visitors: number }[];
  devices: { name: string; visitors: number }[];
  sections: { name: string; visitors: number }[];
  ctas: { name: string; clicks: number }[];
  scroll: { p25: number; p50: number; p75: number; p100: number };
  funnel: { visitors: number; contact_section: number; chat_open: number; converted: number };
};

const SECTION_NAMES: Record<string, string> = {
  "ninja-flow": "Inicio (hero)",
  pos: "NinjaPOS",
  rubros: "Hecho para tu rubro",
  medios: "Medios de pago",
  funciones: "Funciones",
  food: "Ninja Food",
  servicios: "Servicios",
  nosotros: "Nosotros",
  experiencia: "Quiénes somos",
  hablemos: "Contacto",
};
const CTA_NAMES: Record<string, string> = { "probar-ninjapos": "Probar NinjaPOS", "ingresar-ninjafood": "Ingresar a Ninja Food", instagram: "Instagram" };
const RANGES = [7, 30, 90];

function Panel({ title, icon: I, children }: { title: string; icon: typeof Eye; children: React.ReactNode }) {
  return (
    <section className="ix-card p-5">
      <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold">
        <I size={16} className="ix-muted" /> {title}
      </h2>
      {children}
    </section>
  );
}

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : null);

export function StatsTab({ sb }: { sb: SupabaseClient }) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStats(null);
    setError(null);
    let alive = true; // si cambiás de rango rápido, una respuesta vieja no pisa a la nueva
    sb.rpc("internal_stats", { p_days: days }).then(({ data, error: err }) => {
      if (!alive) return;
      if (err) setError(err.message);
      else setStats(data as Stats);
    });
    return () => {
      alive = false;
    };
  }, [sb, days]);

  const charts = useMemo(() => {
    if (!stats) return null;
    const labels = stats.daily.map((d) => d.d.slice(5).split("-").reverse().join("/"));
    const donut = (data: { name: string; value: number }[]) => ({
      tooltip: { trigger: "item" as const, formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, textStyle: { color: "#a99fd0" }, icon: "circle" },
      series: [
        {
          type: "pie" as const,
          radius: ["52%", "78%"],
          center: ["50%", "44%"],
          itemStyle: { borderColor: "#120c26", borderWidth: 3, borderRadius: 6 },
          label: { show: false },
          data,
        },
      ],
    });
    const hbar = (names: string[], values: number[], color: string) => ({
      grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis" as const, axisPointer: { type: "shadow" as const } },
      xAxis: { type: "value" as const, minInterval: 1, ...axisStyle },
      yAxis: { type: "category" as const, data: names, inverse: true, ...axisStyle, splitLine: { show: false } },
      series: [{ type: "bar" as const, data: values, barMaxWidth: 18, itemStyle: { color, borderRadius: [0, 6, 6, 0] }, label: { show: true, position: "right" as const, color: "#f4f2ff" } }],
    });
    return {
      traffic: {
        grid: { left: 8, right: 8, top: 36, bottom: 4, containLabel: true },
        tooltip: { trigger: "axis" as const },
        legend: { top: 0, textStyle: { color: "#a99fd0" }, icon: "circle" },
        xAxis: { type: "category" as const, data: labels, ...axisStyle, splitLine: { show: false } },
        yAxis: { type: "value" as const, minInterval: 1, ...axisStyle },
        series: [
          { name: "Visitas", type: "line" as const, smooth: true, showSymbol: false, lineStyle: { width: 3 }, data: stats.daily.map((d) => d.views) },
          {
            name: "Visitantes",
            type: "line" as const,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 3 },
            areaStyle: { opacity: 0.15 },
            data: stats.daily.map((d) => d.visitors),
          },
          { name: "Chats", type: "bar" as const, barMaxWidth: 10, itemStyle: { borderRadius: [4, 4, 0, 0] }, data: stats.daily.map((d) => d.chats) },
          { name: "Contactos nuevos", type: "bar" as const, barMaxWidth: 10, itemStyle: { borderRadius: [4, 4, 0, 0] }, data: stats.daily.map((d) => d.contacts) },
        ],
      },
      sources: donut(stats.sources.map((s) => ({ name: s.name, value: s.visitors }))),
      devices: donut(stats.devices.map((s) => ({ name: s.name, value: s.visitors }))),
      sections: hbar(
        stats.sections.map((s) => SECTION_NAMES[s.name] ?? s.name),
        stats.sections.map((s) => s.visitors),
        CHART_COLORS[1],
      ),
      ctas: hbar(
        stats.ctas.map((s) => CTA_NAMES[s.name] ?? s.name),
        stats.ctas.map((s) => s.clicks),
        CHART_COLORS[0],
      ),
      scroll: {
        grid: { left: 8, right: 8, top: 16, bottom: 4, containLabel: true },
        tooltip: { trigger: "axis" as const },
        xAxis: { type: "category" as const, data: ["25%", "50%", "75%", "100%"], ...axisStyle, splitLine: { show: false } },
        yAxis: { type: "value" as const, minInterval: 1, ...axisStyle },
        series: [
          {
            type: "bar" as const,
            barMaxWidth: 42,
            itemStyle: { color: CHART_COLORS[2], borderRadius: [6, 6, 0, 0] },
            label: { show: true, position: "top" as const, color: "#f4f2ff" },
            data: [stats.scroll.p25, stats.scroll.p50, stats.scroll.p75, stats.scroll.p100],
          },
        ],
      },
      funnel: {
        tooltip: { trigger: "item" as const, formatter: "{b}: {c}" },
        series: [
          {
            type: "funnel" as const,
            left: "6%",
            width: "88%",
            top: 8,
            bottom: 8,
            minSize: "18%",
            sort: "none" as const,
            gap: 4,
            label: { color: "#fff", fontWeight: 600, formatter: "{b}  {c}" },
            itemStyle: { borderWidth: 0 },
            data: [
              { name: "Visitantes", value: stats.funnel.visitors },
              { name: "Llegaron a Contacto", value: stats.funnel.contact_section },
              { name: "Abrieron el chat", value: stats.funnel.chat_open },
              { name: "Escribieron / formulario", value: stats.funnel.converted },
            ],
          },
        ],
      },
    };
  }, [stats]);

  return (
    <div>
      <PageHeader
        eyebrow="Medición"
        title="Estadísticas"
        desc="Visitas medidas por nosotros, sin cookies: de dónde llegan, qué miran y cuántos terminan escribiendo."
        actions={
          <div className="flex rounded-lg border border-white/10 bg-white/[.04] p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDays(r)}
                className={`rounded-md px-3 py-1.5 text-[13px] font-semibold ${days === r ? "bg-white/[.12] text-white" : "ix-muted hover:text-white"}`}
              >
                {r} días
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <div className="ix-card">
          <Empty icon={ChartLineUp} title="No pudimos cargar las estadísticas" desc={error} />
        </div>
      ) : !stats || !charts ? (
        <div className="ix-card">
          <SpinnerBlock />
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <Kpi icon={UsersThree} label="Visitantes" value={stats.totals.visitors} sub="Únicos por día, sumados" />
            <Kpi icon={Eye} label="Visitas" value={stats.totals.views} />
            <Kpi icon={Funnel} label="Conversión" value={pct(stats.funnel.converted, stats.funnel.visitors)} sub="Escribieron o formulario" tone="#ff8a4c" />
            <Kpi icon={ChatsCircle} label="Abrieron el chat" value={stats.totals.chat_open} />
            <Kpi icon={PaperPlaneTilt} label="Formularios" value={stats.totals.forms} />
            <Kpi icon={Mouse} label="Scroll promedio" value={`${stats.totals.avg_scroll}%`} sub="De la página" />
          </div>

          <Panel title="Tráfico y conversaciones" icon={ChartLineUp}>
            <EChart option={charts.traffic} height={300} />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Embudo" icon={Funnel}>
              {stats.funnel.visitors ? <EChart option={charts.funnel} height={260} /> : <Empty icon={Funnel} title="Sin visitas todavía" desc="Cuando haya tráfico vas a ver cuántos llegan a escribir." />}
            </Panel>
            <Panel title="De dónde llegan" icon={UsersThree}>
              {stats.sources.length ? <EChart option={charts.sources} height={260} /> : <Empty icon={UsersThree} title="Sin datos todavía" />}
            </Panel>
            <Panel title="Secciones más vistas" icon={Eye}>
              {stats.sections.length ? <EChart option={charts.sections} height={280} /> : <Empty icon={Eye} title="Sin datos todavía" />}
            </Panel>
            <Panel title="Dispositivos" icon={Mouse}>
              {stats.devices.length ? <EChart option={charts.devices} height={280} /> : <Empty icon={Mouse} title="Sin datos todavía" />}
            </Panel>
            <Panel title="Hasta dónde bajan" icon={Mouse}>
              <EChart option={charts.scroll} height={240} />
            </Panel>
            <Panel title="Clics en llamados a la acción" icon={CursorClick}>
              {stats.ctas.length ? <EChart option={charts.ctas} height={240} /> : <Empty icon={CursorClick} title="Sin clics todavía" />}
            </Panel>
          </div>

          <section className="ix-card overflow-hidden">
            <h2 className="px-5 pb-2 pt-5 text-[15px] font-bold">Campañas con UTM</h2>
            <p className="ix-muted px-5 pb-3 text-[13px]">
              Compartí links como <code className="rounded bg-white/[.06] px-1.5 py-0.5 text-[12px]">soft.ninja/?utm_source=instagram&amp;utm_campaign=promo</code> y medí cada uno acá.
            </p>
            {stats.campaigns.length ? (
              <table className="ix-table">
                <thead>
                  <tr>
                    <th>Campaña</th>
                    <th className="text-right">Visitantes</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.campaigns.map((c) => (
                    <tr key={c.name}>
                      <td className="font-medium">{c.name}</td>
                      <td className="text-right">{c.visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="ix-muted border-t border-white/10 px-5 py-6 text-center text-[14px]">Todavía no llegaron visitas con UTM.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
