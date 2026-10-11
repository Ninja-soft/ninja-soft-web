"use client";

import { useEffect, useRef, useState } from "react";
import { CashRegister, ChartLineUp, CodeBlock, PlugsConnected, ShieldCheck, type Icon } from "@phosphor-icons/react";
import { PillarShowcase, SCENE_IMAGES } from "./PillarShowcase";

// Frase rotativa + 6 pilares (estilo keynote de Apple).
// Izquierda: lista de pilares con barra de progreso. Derecha: vitrina oscura
// que muestra el pilar activo "en acción". Rota sola; se pausa con el mouse
// encima. Con "reducir movimiento" se apagan las animaciones, no la rotación.
// Íconos: Phosphor (MIT), estilo duotono.

const IDLE = "#7F75A6";
const FLAME = "#FF7A2E";

export type PillarKey = "integrar" | "vender" | "ml" | "controlar" | "proteger" | "medida";
// `ms`: duración de cada pilar, a la medida de su escena en la vitrina.
type Pillar = { key: PillarKey; ms: number; phrase: string; title: string; desc: string; Icon?: Icon };

const PILLARS: Pillar[] = [
  { key: "integrar", ms: 9000, phrase: "integrar todo", title: "Integrá", desc: "Medios de pago, tienda online, delivery y tu ecommerce.", Icon: PlugsConnected },
  { key: "vender", ms: 7600, phrase: "vender fácil", title: "Vendé", desc: "Escaneás, cobrás y listo. Con cuotas.", Icon: CashRegister },
  { key: "ml", ms: 7800, phrase: "vender en Mercado Libre", title: "Mercado Libre", desc: "Publicá, sincronizá stock, imprimí etiquetas y manejá la central de promociones." },
  { key: "controlar", ms: 5600, phrase: "controlar cada peso", title: "Controlá", desc: "Caja, stock y reportes en tiempo real.", Icon: ChartLineUp },
  { key: "proteger", ms: 5800, phrase: "proteger tu negocio", title: "Protegé", desc: "Permisos, auditoría y datos resguardados.", Icon: ShieldCheck },
  { key: "medida", ms: 6200, phrase: "lo que tu negocio necesite", title: "A medida", desc: "¿Necesitás algo que no tenemos? Lo desarrollamos.", Icon: CodeBlock },
];

export function HeroPillars() {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [tick, setTick] = useState(0);
  // Slider mobile: lleva el pilar activo a la vista sin mover la página.
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (!list || window.matchMedia("(min-width: 640px)").matches) return;
    const item = list.children[active] as HTMLElement | undefined;
    if (!item) return;
    const left = item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    if (hover) return;
    const id = window.setTimeout(() => {
      setActive((a) => (a + 1) % PILLARS.length);
      setTick((t) => t + 1);
    }, PILLARS[active].ms);
    return () => window.clearTimeout(id);
  }, [hover, active, tick]);

  // Precarga y decodifica todas las imágenes de las escenas en segundo plano.
  useEffect(() => {
    const idle = (cb: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb) : setTimeout(cb, 300);
    idle(() => {
      for (const src of SCENE_IMAGES) {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        img.decode?.().catch(() => {});
      }
    });
  }, []);

  const pick = (i: number) => {
    setActive(i);
    setTick((t) => t + 1);
  };

  const current = PILLARS[active];

  return (
    <div className="mx-auto mt-8 max-w-5xl">
      <p className="sr-only">
        Un solo sistema para integrar todo, vender fácil, vender en Mercado Libre, controlar cada peso y proteger tu
        negocio. Y si necesitás algo que no tenemos, lo desarrollamos a medida.
      </p>
      {/* Frase en una línea: el tramo que rota va en una cápsula tipo terminal,
          bien distinta del título (más chica, clara sobre oscuro, cursor naranja). */}
      <div aria-hidden className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 text-[clamp(20px,2.3vw,28px)]">
        <span className="font-medium text-ink-2">Un solo sistema para</span>
        <span className="inline-flex items-center rounded-2xl bg-night px-4 py-1.5 font-display font-bold leading-tight text-snow ring-1 ring-white/10">
          <span key={current.phrase} className="whitespace-pre">
            {Array.from(current.phrase).map((ch, i) => (
              <span key={i} className="letter-in" style={{ animationDelay: `${i * 22}ms` }}>
                {ch}
              </span>
            ))}
          </span>
          <span className="caret ml-1 inline-block h-[1.05em] w-[3px] rounded-full bg-[#FF7A2E]" />
        </span>
      </div>

      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="mt-9 grid gap-0 border-y border-line bg-white/85 text-left sm:gap-3 sm:rounded-[32px] sm:border sm:p-2 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"
      >
        {/* Lista de pilares */}
        <ul
          ref={listRef}
          className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] sm:grid sm:snap-none sm:grid-cols-3 sm:gap-1 sm:overflow-visible sm:p-0 lg:grid-cols-1 [&::-webkit-scrollbar]:hidden"
        >
          {PILLARS.map((p, i) => {
            const on = i === active;
            return (
              <li key={p.key} className="shrink-0 snap-center sm:shrink">
                <button
                  type="button"
                  onClick={() => pick(i)}
                  aria-pressed={on}
                  className={`relative flex w-full items-center gap-2.5 overflow-hidden whitespace-nowrap rounded-[20px] py-2 pl-2 pr-4 text-left transition-colors duration-500 sm:gap-3.5 sm:whitespace-normal sm:px-3.5 sm:py-3 ${
                    on ? "bg-white shadow-[0_1px_0_rgba(17,12,34,.04)] ring-1 ring-ink/[.06]" : "hover:bg-white/70"
                  }`}
                >
                  <span className="relative shrink-0">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-[14px] transition-colors duration-700 ${
                      on ? (p.key === "ml" ? "bg-white ring-1 ring-ink/10" : "bg-night") : "bg-paper-2"
                    }`}
                  >
                    <span className={`inline-flex ${on ? (p.key === "ml" ? "icon-shake" : "icon-pop") : ""}`}>
                      {p.key === "ml" ? (
                        <img
                          src="/images/integrations/mercadolibre.webp"
                          alt=""
                          width={300}
                          height={207}
                          className={`h-7 w-auto transition-[filter,opacity] duration-700 ${on ? "opacity-100 grayscale-0" : "opacity-55 grayscale"}`}
                        />
                      ) : (
                        p.Icon && (
                          <span className="transition-colors duration-700" style={{ color: on ? FLAME : IDLE }}>
                            <p.Icon size={24} weight="duotone" color="currentColor" />
                          </span>
                        )
                      )}
                    </span>
                  </span>
                  {/* Anillo alrededor del ícono: tiempo hasta el siguiente pilar */}
                  {on && (
                    <svg aria-hidden viewBox="0 0 52 52" className="pointer-events-none absolute -inset-1 h-[52px] w-[52px]">
                      <rect
                        key={tick}
                        x="1.25"
                        y="1.25"
                        width="49.5"
                        height="49.5"
                        rx="16.5"
                        pathLength={100}
                        fill="none"
                        stroke={p.key === "ml" ? "#2D3277" : FLAME}
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="pillar-ring"
                        style={{ animationDuration: `${p.ms}ms`, animationPlayState: hover ? "paused" : "running" }}
                      />
                    </svg>
                  )}
                  </span>
                  <span className="min-w-0">
                    <span className={`block font-display text-[17px] font-bold transition-colors duration-500 ${on ? "text-ink" : "text-ink/65"}`}>
                      {p.title}
                    </span>
                    <span
                      className={`hidden overflow-hidden text-[13.5px] leading-snug text-ink-2 transition-[max-height,opacity] duration-500 lg:block ${
                        on ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      {p.desc}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Vitrina del pilar activo */}
        <PillarShowcase active={current.key} title={current.title} desc={current.desc} />
      </div>
    </div>
  );
}
