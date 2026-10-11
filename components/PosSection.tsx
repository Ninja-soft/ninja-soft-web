"use client";

import { useEffect, useRef, useState } from "react";
import { Coffee, Pause, Play, Scissors, ShoppingBag, Storefront, TShirt, type Icon } from "@phosphor-icons/react";
import { POS_APP_URL } from "@/lib/content";
import { ScreenGastro, ScreenKiosco, ScreenPro, ScreenRetail, ScreenTextil } from "./rubros/RubroScreens";

// NinjaPOS por rubro: un selector (control segmentado) y la pantalla del POS
// recreada para cada negocio dentro de un equipo con el halo de marca.
// Rota sola siempre (barra de progreso en la pestaña); se pausa con el mouse encima.

type Rubro = {
  key: string;
  label: string;
  Icon: Icon;
  title: string;
  points: string[];
  Screen: () => React.JSX.Element;
};

const RUBROS: Rubro[] = [
  {
    key: "gastro",
    label: "Gastronomía",
    Icon: Coffee,
    title: "Mesas, cocina y delivery, en una pantalla.",
    points: ["Gestión de mesas y salón", "Comandas a cocina", "Rappi, PedidosYa y Uber Eats", "Delivery propio"],
    Screen: ScreenGastro,
  },
  {
    key: "retail",
    label: "Retail",
    Icon: ShoppingBag,
    title: "Vendé, cobrá y facturá en segundos.",
    points: ["Catálogo con imágenes", "Cuotas y todos los medios de pago", "Stock por sucursal y depósito"],
    Screen: ScreenRetail,
  },
  {
    key: "textil",
    label: "Textil",
    Icon: TShirt,
    title: "Talles, colores y etiquetas, sin caos.",
    points: ["Variantes por talle y color", "Etiquetas con código de barras", "Cambios y devoluciones con vale"],
    Screen: ScreenTextil,
  },
  {
    key: "kiosco",
    label: "Kioscos",
    Icon: Storefront,
    title: "La venta más rápida del barrio.",
    points: ["Lector de códigos y PLU", "Botones rápidos de lo que más sale", "Cuenta corriente para clientes"],
    Screen: ScreenKiosco,
  },
  {
    key: "pro",
    label: "Profesionales",
    Icon: Scissors,
    title: "Agenda llena, cero ausencias.",
    points: ["Agenda por profesional", "Recordatorios automáticos", "Packs de sesiones prepagas"],
    Screen: ScreenPro,
  },
];

const ROTATE_MS = 11000;

export function PosSection() {
  const [i, setI] = useState(0);
  const [tick, setTick] = useState(0); // reinicia el temporizador al elegir
  const [hover, setHover] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  useEffect(() => setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  // Arranca recién cuando la sección entra en pantalla (y se pausa al salir).
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setStarted(true);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // rota sola mientras se ve; se pausa con el mouse encima del panel o con el botón
  useEffect(() => {
    if (!inView || hover || paused || reduce) return;
    const id = window.setTimeout(() => setI((v) => (v + 1) % RUBROS.length), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [i, tick, hover, paused, reduce, inView]);
  const r = RUBROS[i];

  return (
    <section ref={sectionRef} id="rubros" className="rubros relative overflow-hidden bg-[#0b0720] px-4 pb-16 pt-16 text-center text-snow sm:rounded-tile sm:pb-20 sm:pt-20">
      <div aria-hidden className="rubros-bg" />
      <img src="/images/brand/ninjapos-logo-dark.webp" alt="NinjaPOS" width={640} height={154} className="relative mx-auto h-9 w-auto sm:h-10" />
      <h2 className="relative mt-4 text-[clamp(34px,5vw,60px)] font-bold leading-[1.04] tracking-[-0.03em]">Hecho para tu rubro.</h2>

      {/* selector de rubro */}
      <div
        role="tablist"
        aria-label="Rubros"
        className="rubro-tabs relative -mx-4 mt-7 flex snap-x gap-1 overflow-x-auto px-4 py-1 sm:mx-auto sm:w-fit sm:rounded-full sm:p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {RUBROS.map((x, k) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={k === i}
            onClick={() => {
              setI(k);
              setTick((t) => t + 1);
            }}
            className={`relative flex shrink-0 snap-center items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors duration-300 ${
              k === i ? "bg-white text-[#100a2e]" : "text-white/70 hover:text-white"
            }`}
          >
            <x.Icon size={18} weight={k === i ? "fill" : "regular"} />
            {x.label}
          </button>
        ))}
      </div>

      <p key={r.key + "t"} className="rb-fade relative mx-auto mt-5 text-balance text-[clamp(20px,2.4vw,30px)] font-bold leading-tight tracking-[-0.02em] text-white/90">
        {r.title}
      </p>

      {/* panel con la escena del rubro */}
      <div className="relative mx-auto mt-10 max-w-[1040px]">
        <span aria-hidden className="rubro-halo" />
        <div className="rubro-panel relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <div className="rubro-scale">
            {/* la escena se monta al llegar a la sección: sus animaciones empiezan desde cero ahí */}
            <div key={`${r.key}-${started}`} className={`rb-fade h-full w-full ${started ? "" : "rb-hold"} ${inView ? "" : "rb-paused"}`}>
              <r.Screen />
            </div>
          </div>
        </div>
      </div>

      {/* controles estilo apple.com: puntos (el activo se estira y se llena) + play/pausa */}
      <div className="relative mt-6 flex items-center justify-center gap-3">
        <div className="flex h-12 items-center gap-2.5 rounded-full bg-white/[.09] px-5 backdrop-blur">
          {RUBROS.map((x, k) => (
            <button
              key={x.key}
              type="button"
              aria-label={`Ver ${x.label}`}
              onClick={() => {
                setI(k);
                setTick((t) => t + 1);
              }}
              className={`relative h-2 overflow-hidden rounded-full transition-[width,background-color] duration-500 ${
                k === i ? "w-12 bg-white/25" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            >
              {k === i && (
                <span
                  key={`${i}-${tick}`}
                  className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-white"
                  style={{
                    animation: reduce ? "none" : `pillar-progress ${ROTATE_MS}ms linear forwards`,
                    animationPlayState: hover || paused || !inView ? "paused" : "running",
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          aria-label={paused ? "Reproducir" : "Pausar"}
          className="grid h-12 w-12 place-items-center rounded-full bg-white/[.09] text-white backdrop-blur transition hover:bg-white/15"
        >
          {paused ? <Play size={18} weight="fill" /> : <Pause size={18} weight="fill" />}
        </button>
      </div>

      <ul key={r.key + "p"} className="rb-fade relative mx-auto mt-9 flex max-w-3xl flex-wrap justify-center gap-2">
        {r.points.map((p) => (
          <li key={p} className="rounded-full border border-white/10 bg-white/[.05] px-4 py-2 text-[14px]">
            {p}
          </li>
        ))}
      </ul>

      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-8">
        <a href={POS_APP_URL} className="link-more">
          Probar gratis
        </a>
        <a href="#funciones" className="link-more">
          Ver funciones
        </a>
      </div>
    </section>
  );
}
