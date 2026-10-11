"use client";

import { useEffect, useRef, useState } from "react";
import {
  Barcode,
  CheckCircle,
  ClipboardText,
  CookingPot,
  Package,
  Snowflake,
  Thermometer,
  Truck,
  type Icon,
} from "@phosphor-icons/react";

// Canvas estilo n8n: el recorrido completo de un lote, de la materia prima al cliente.
// Al entrar en pantalla se "ejecuta" nodo por nodo (como un workflow) y vuelve a empezar.
type Node = { Icon: Icon; title: string; detail: string; tag: string; color: string };

export const FLOW: Node[] = [
  { Icon: Truck, title: "Ingreso de mercadería", detail: "Proveedor con RNE vigente · Remito 0001-2381", tag: "Lote prov. 4471", color: "#3b82f6" },
  { Icon: Thermometer, title: "Control de ingreso", detail: "Cadena de frío y rótulo del proveedor", tag: "−18,4 °C · OK", color: "#0ea5e9" },
  { Icon: Package, title: "Stock en cámara", detail: "Cámara 2 · ordenado por vencimiento (FEFO)", tag: "Vence 14/11", color: "#8b5cf6" },
  { Icon: ClipboardText, title: "Planilla de producción", detail: "Receta, lotes asignados y firma con PIN", tag: "PROD-0193", color: "#f59e0b" },
  { Icon: CookingPot, title: "Producción", detail: "Empanadas de carne · 1.200 u · rendimiento 96 %", tag: "Lote L-2610-014", color: "#ff6a1a" },
  { Icon: Snowflake, title: "Congelado", detail: "Regla CAA de congelados aplicada sola", tag: "Vence 08/12", color: "#06b6d4" },
  { Icon: Barcode, title: "Rótulo y códigos", detail: "GS1-128, QR público, octógonos y RNPA", tag: "Listo para imprimir", color: "#22c55e" },
  { Icon: Truck, title: "Despacho y recall", detail: "Remito al cliente · transporte UTA · retiro en 1 clic", tag: "Cliente: Almacén Sur", color: "#16a34a" },
];

// Posiciones en el lienzo de 1100 × 470 (dos filas en "S": ida y vuelta).
const W = 230;
const H = 112;
const POS = [
  [30, 50],
  [300, 50],
  [570, 50],
  [840, 50],
  [840, 300],
  [570, 300],
  [300, 300],
  [30, 300],
] as const;

function edgePath(a: number, b: number): string {
  const [ax, ay] = POS[a];
  const [bx, by] = POS[b];
  if (ay === by) {
    // misma fila: de lado a lado
    const forward = bx > ax;
    const x1 = forward ? ax + W : ax;
    const x2 = forward ? bx : bx + W;
    const y = ay + H / 2;
    const k = (x2 - x1) / 2;
    return `M${x1},${y} C${x1 + k},${y} ${x2 - k},${y} ${x2},${y}`;
  }
  // cambio de fila (a la derecha): sale por abajo, entra por arriba
  const x = ax + W / 2;
  return `M${x},${ay + H} C${x},${ay + H + 70} ${x},${by - 70} ${x},${by}`;
}

const STEP_MS = 900;

export function FoodFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(-1);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(FLOW.length);
      return;
    }
    // avanza nodo por nodo; al terminar, una pausa y vuelve a ejecutar
    const id = window.setTimeout(() => setStep((s) => (s >= FLOW.length + 2 ? -1 : s + 1)), step >= FLOW.length ? 2200 : STEP_MS);
    return () => window.clearTimeout(id);
  }, [inView, step]);

  const done = (i: number) => step > i;
  const running = (i: number) => step === i;

  return (
    <div ref={ref} className="food-canvas relative mx-auto mt-10 max-w-[1100px] overflow-hidden rounded-[24px] text-left">
      {/* barra superior estilo editor de workflows */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 text-[13px] text-white/70 sm:px-5">
        <span className="hidden gap-1.5 sm:flex">
          <i className="h-3 w-3 rounded-full bg-white/15" />
          <i className="h-3 w-3 rounded-full bg-white/15" />
          <i className="h-3 w-3 rounded-full bg-white/15" />
        </span>
        <b className="min-w-0 flex-1 truncate font-semibold text-white">
          <span className="hidden sm:inline">Traza · Empanadas de carne · </span>Lote L-2610-014
        </b>
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <i className={`h-2 w-2 rounded-full ${step >= 0 && step < FLOW.length ? "animate-pulse bg-[#22c55e]" : step >= FLOW.length ? "bg-[#22c55e]" : "bg-white/30"}`} />
          {step >= FLOW.length ? "Completo" : step >= 0 ? "Ejecutando…" : "Listo"}
        </span>
      </div>

      {/* escritorio: lienzo con nodos y conexiones */}
      <div className="hidden md:block">
        <div className="food-stage">
          <div className="food-scale">
          <svg viewBox="0 0 1100 470" className="absolute inset-0 h-full w-full" aria-hidden>
            {FLOW.slice(1).map((_, k) => (
              <g key={k}>
                <path d={edgePath(k, k + 1)} className="food-edge" />
                <path d={edgePath(k, k + 1)} className={`food-edge-flow ${done(k) ? "is-on" : ""}`} />
              </g>
            ))}
          </svg>
          {FLOW.map((n, i) => (
            <div
              key={n.title}
              className={`food-node ${running(i) ? "is-running" : ""} ${done(i) ? "is-done" : ""}`}
              style={{ left: POS[i][0], top: POS[i][1], width: W, height: H }}
            >
              <span className="food-port food-port-in" />
              <span className="food-port food-port-out" />
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-white" style={{ background: n.color }}>
                  <n.Icon size={21} weight="fill" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-white">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-white/60">{n.detail}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="rounded-md bg-white/[.07] px-2 py-0.5 font-mono text-[11px] text-white/80">{n.tag}</span>
                {done(i) && <CheckCircle size={18} weight="fill" className="text-[#22c55e]" aria-label="Completado" />}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* celular: el mismo recorrido en vertical */}
      <ol className="grid gap-0 p-4 md:hidden">
        {FLOW.map((n, i) => (
          <li key={n.title} className="relative flex gap-3 pb-4 last:pb-0">
            {i < FLOW.length - 1 && <span aria-hidden className={`absolute left-[19px] top-11 h-[calc(100%-36px)] w-[2px] ${done(i) ? "bg-[#22c55e]" : "bg-white/12"}`} />}
            <span className="relative z-[1] grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-white" style={{ background: n.color }}>
              <n.Icon size={20} weight="fill" />
            </span>
            <div className={`food-node-m min-w-0 flex-1 ${running(i) ? "is-running" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-semibold text-white">{n.title}</p>
                {done(i) && <CheckCircle size={17} weight="fill" className="shrink-0 text-[#22c55e]" />}
              </div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-white/60">{n.detail}</p>
              <span className="mt-1.5 inline-block rounded-md bg-white/[.07] px-2 py-0.5 font-mono text-[11px] text-white/80">{n.tag}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
