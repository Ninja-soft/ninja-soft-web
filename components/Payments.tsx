"use client";

import { useEffect, useRef, useState } from "react";
import { ContactlessPayment, CreditCard, Link, QrCode } from "@phosphor-icons/react";
import { NETWORKS, PROCESSORS } from "@/lib/content";

// "Cobrá con todo", estética iOS:
//  - procesadores como widgets (logo, nombre y qué cobra)
//  - tarjetas y redes como íconos de app con su nombre debajo
//  - formas de cobro (Point, QR, sin contacto, link) como cápsulas con ícono
// Entran en cascada al aparecer la sección (sólo transform/opacity).

const WAYS = [
  { Icon: CreditCard, label: "Point" },
  { Icon: QrCode, label: "QR" },
  { Icon: ContactlessPayment, label: "Sin contacto" },
  { Icon: Link, label: "Link de pago" },
];

const WHAT: Record<string, string> = {
  "Mercado Pago": "QR · Point · Link",
  MODO: "QR · Billeteras bancarias",
  Payway: "Tarjetas · Cuotas · Link",
  Getnet: "Tarjetas · Débito",
  Nave: "QR · Tarjetas",
  Fiserv: "Posnet · Clover",
  Mobbex: "Link · Cuotas",
  Pagos360: "Link · DEBIN",
};

export function Payments() {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id="medios" className={`pay-sec relative overflow-hidden bg-[#f2f2f7] px-4 pb-16 pt-16 text-center sm:rounded-tile sm:pb-20 sm:pt-20 ${on ? "is-on" : ""}`}>
      <div aria-hidden className="pay-sec-bg" />
      <p className="relative text-[15px] font-semibold text-flame-link">Medios de pago</p>
      <h2 className="relative mt-2 text-[clamp(34px,5vw,60px)] font-bold leading-[1.04] tracking-[-0.03em]">Cobrá con todo.</h2>
      <p className="relative mx-auto mt-3 max-w-[40ch] text-[clamp(17px,1.8vw,21px)] text-[#6e6e73]">
        Todos los medios de pago del país, conectados a tu caja. Con cuotas y planes propios en cada uno.
      </p>

      {/* widgets de procesadores */}
      <div className="relative mx-auto mt-12 grid max-w-[1040px] grid-cols-2 gap-3 text-left md:grid-cols-4 md:gap-4">
        {PROCESSORS.map((p, i) => (
          <div key={p.alt} className="ios-widget" style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
            <div className="flex h-12 items-center">
              <img src={p.src} alt={p.alt} className="max-h-full max-w-[78%] object-contain object-left" />
            </div>
            <div className="mt-4">
              <p className="text-[15px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{p.alt}</p>
              <p className="mt-0.5 text-[13px] text-[#86868b]">{WHAT[p.alt]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* tarjetas y redes como íconos de app */}
      <p className="relative mt-14 text-[13px] font-semibold uppercase tracking-[.14em] text-[#86868b]">Tarjetas, billeteras y redes</p>
      {/* escritorio: grilla */}
      <ul className="relative mx-auto mt-6 hidden max-w-[860px] flex-wrap justify-center gap-x-5 gap-y-5 sm:flex">
        {NETWORKS.map((n, i) => (
          <li key={n.alt} className="ios-app flex flex-col items-center gap-2" style={{ "--d": `${500 + i * 45}ms` } as React.CSSProperties}>
            <NetworkIcon src={n.src} />
            <span className="max-w-[72px] truncate text-[11px] text-[#3a3a3c]">{n.alt}</span>
          </li>
        ))}
      </ul>
      {/* celular: tira que se desliza sola (y se puede arrastrar) */}
      <div className="net-marquee relative mt-6 sm:hidden" aria-label="Tarjetas, billeteras y redes">
        <ul className="net-track flex w-max gap-4 px-2">
          {[...NETWORKS, ...NETWORKS].map((n, i) => (
            <li key={`${n.alt}-${i}`} aria-hidden={i >= NETWORKS.length} className="flex w-[64px] flex-col items-center gap-2">
              <NetworkIcon src={n.src} />
              <span className="max-w-[72px] truncate text-[11px] text-[#3a3a3c]">{n.alt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* formas de cobro */}
      <p className="relative mt-12 text-[13px] font-semibold uppercase tracking-[.14em] text-[#86868b]">Cobrá como quieras</p>
      <ul className="relative mx-auto mt-5 grid max-w-[720px] grid-cols-2 gap-3 sm:grid-cols-4">
        {WAYS.map((w, i) => (
          <li key={w.label} className="ios-app flex items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,.06),0_6px_16px_rgba(0,0,0,.05)]" style={{ "--d": `${1000 + i * 60}ms` } as React.CSSProperties}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[linear-gradient(135deg,#ff4b22,#ff8a1f)] text-white">
              <w.Icon size={20} weight="fill" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{w.label}</span>
          </li>
        ))}
      </ul>

      <p className="relative mx-auto mt-8 text-[13px] text-[#6e6e73] sm:whitespace-nowrap sm:text-[15px]">
        Además: efectivo con cálculo de vuelto, transferencia, QR interoperable y DEBIN.
      </p>
    </section>
  );
}

function NetworkIcon({ src }: { src: string }) {
  return (
    <span className="grid aspect-square w-[52px] place-items-center overflow-hidden rounded-[22.5%] bg-white shadow-[0_1px_2px_rgba(0,0,0,.06),0_6px_16px_rgba(0,0,0,.06)] ring-1 ring-black/[.04] sm:w-[58px]">
      <img src={src} alt="" className="h-full w-full" />
    </span>
  );
}
