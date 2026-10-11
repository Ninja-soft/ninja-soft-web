"use client";

import { useEffect, useRef, useState } from "react";

// Sección keynote (estética apple.com, modo oscuro):
//  1) "POS" en letras metálicas detrás; el POS (secuencia de cuadros con
//     transparencia sobre canvas) gira con el scroll hasta la pantalla del QR.
//  2) Llegan notificaciones estilo iOS (vidrio) de cobros acreditados por QR,
//     Point y link de pago, y el mail con la factura. Un control segmentado
//     marca el medio de cada cobro.
// Todo lo maneja el progreso del scroll (0→1) en un único rAF, sólo con la
// sección a la vista. Con "reducir movimiento" se ve el estado final.

const FRAMES = 43; // arranca con la mano ya fuera de cuadro
const frameSrc = (i: number) => `/images/showcase/pos-frames/${String(i).padStart(3, "0")}.webp`;
const SPIN_END = 0.5; // hasta acá el scroll gira el POS

type Method = "qr" | "point" | "link";
const icon = (name: string) => `/images/app-icons/${name}.webp`;
const NOTES = [
  { at: 0.55, method: "qr" as Method, app: "Mercado Pago", icon: icon("mercadopago"), title: "Cobro acreditado", amount: "$ 267.800", text: "QR · Caja 1 · Tienda Urbana" },
  { at: 0.64, method: "point" as Method, app: "Getnet", icon: icon("getnet"), title: "Cobro con débito", amount: "$ 32.400", text: "Mastercard débito · Caja 2" },
  { at: 0.76, method: "link" as Method, app: "Payway", icon: icon("payway"), title: "Link de pago cobrado", amount: "$ 48.900", text: "Pedido #2381 · tienda online" },
  { at: 0.82, method: null, app: "Mercado Libre", icon: icon("mercadolibre"), title: "¡Vendiste! Mochila urbana 25 L", amount: "$ 41.565", text: "Stock sincronizado · etiqueta lista" },
  { at: 0.87, method: null, app: "NinjaPOS", icon: icon("ninjapos"), title: "4 ventas conciliadas", amount: "", text: "Caja al día · stock actualizado" },
  { at: 0.92, method: null, app: "Mail", icon: icon("mail"), title: "Factura B 0001-00004821", amount: "", text: "Enviada al cliente automáticamente", pdf: true },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function PosShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState(0); // cantidad de notificaciones visibles
  const [method, setMethod] = useState<Method>("qr");
  const [ready, setReady] = useState(false); // cuadros cargados

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !stage || !canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // cuadros: se crean ya, pero se descargan recién cuando la sección se acerca (no frenan la carga inicial)
    const imgs: HTMLImageElement[] = Array.from({ length: FRAMES }, () => {
      const im = new Image();
      im.decoding = "async";
      return im;
    });
    let loading = false;
    const loadFrames = () => {
      if (loading) return;
      loading = true;
      imgs.forEach((im, i) => (im.src = frameSrc(i)));
      imgs[0].onload = () => draw(lastFrame < 0 ? 0 : lastFrame);
      // listo cuando están los primeros cuadros (el resto sigue bajando en segundo plano)
      Promise.all(imgs.slice(0, 12).map((im) => im.decode().catch(() => {}))).then(() => setReady(true));
    };
    const near = new IntersectionObserver(([e]) => e.isIntersecting && loadFrames(), { rootMargin: "600px 0px" });
    near.observe(section);
    let lastFrame = -1;
    const draw = (i: number) => {
      const im = imgs[i];
      if (!im.complete || !im.naturalWidth) {
        im.onload = () => i === lastFrame && draw(i);
        return;
      }
      if (canvas.width !== im.naturalWidth) {
        canvas.width = im.naturalWidth;
        canvas.height = im.naturalHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(im, 0, 0);
    };

    let raf = 0;
    let visible = false;
    let cur = 0;
    let lastCount = -1;

    const tick = () => {
      raf = 0;
      if (!visible) return;
      const r = section.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = reduce ? 1 : total > 0 ? clamp(-r.top / total) : 0;
      cur += (p - cur) * 0.2;
      if (Math.abs(p - cur) < 0.0005) cur = p;

      const spin = clamp(cur / SPIN_END);
      const f = Math.round(spin * (FRAMES - 1));
      if (f !== lastFrame) {
        lastFrame = f;
        draw(f);
      }
      const after = clamp((cur - SPIN_END) / (1 - SPIN_END));
      stage.style.setProperty("--spin", spin.toFixed(4));
      stage.style.setProperty("--after", after.toFixed(4));

      const count = NOTES.filter((n) => cur >= n.at).length;
      if (count !== lastCount) {
        lastCount = count;
        setShown(count);
        const m = [...NOTES].slice(0, count).reverse().find((n) => n.method)?.method;
        setMethod((m as Method) ?? "qr");
      }
      if (cur !== p) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(section);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);

    return () => {
      io.disconnect();
      near.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={sectionRef} id="pos" className="relative h-[340vh] bg-[#f5f5f7]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div ref={stageRef} className="ks relative h-full w-full">
          {/* luz detrás del equipo */}
          <div aria-hidden className="ks-glow" />

          {/* letras cromadas */}
          <p aria-hidden className="ks-chrome">POS</p>

          {/* encabezado */}
          <div className="ks-head absolute inset-x-0 top-[10vh] z-10 px-4 text-center">
            <img loading="lazy" decoding="async" src="/images/brand/ninjapos-logo-light.webp" alt="NinjaPOS" width={640} height={154} className="mx-auto h-7 w-auto" />
            <h2 className="mt-5 font-display text-[clamp(38px,5.8vw,76px)] font-bold leading-[1] tracking-[-0.035em] text-[#1d1d1f]">
              <span className="sr-only">Vendé, cobrá, publicá y facturá.</span>
              <RotatingVerb />
              <span className="mt-1 block text-[0.62em] tracking-[-0.025em]">Todo tu negocio, en una sola plataforma.</span>
            </h2>
            <p className="ks-lede mx-auto mt-4 max-w-[44ch] text-[clamp(16px,1.5vw,19px)] font-medium leading-snug text-[#424245]">
              Todas tus sucursales, depósitos y canales, sincronizados.
            </p>
          </div>

          {/* POS */}
          <div className={`ks-pos absolute left-1/2 top-[69%] w-[min(92vw,800px)] ${ready ? "is-ready" : ""}`}>
            <span aria-hidden className="ks-halo" />
            <span aria-hidden className="ks-floor" />
            {!ready && <span aria-label="Cargando" role="status" className="ks-spinner" />}
            <canvas ref={canvasRef} className="ks-canvas h-auto w-full" aria-label="NinjaPOS girando de la pantalla del cajero a la pantalla del cliente con el QR de cobro" role="img" />
          </div>

          {/* desenfoque progresivo: fuerte abajo, se apaga hacia arriba */}
          <div aria-hidden className="ks-blur">
            <span />
            <span />
            <span />
          </div>

          {/* control segmentado + notificaciones */}
          <div className="ks-side absolute z-20">
            <div className="seg" role="tablist" aria-label="Medios de cobro">
              {(
                [
                  ["qr", "QR"],
                  ["point", "Point"],
                  ["link", "Link de pago"],
                ] as const
              ).map(([k, label]) => (
                <span key={k} role="tab" aria-selected={method === k} className={method === k ? "on" : ""}>
                  {label}
                </span>
              ))}
              <i className={`seg-thumb m-${method}`} />
            </div>

            <ul className="ios-stack" aria-live="polite">
              {NOTES.map((n, i) => (
                <li key={n.title} className={`ios-note ${i < shown ? "in" : ""} ${shown - 1 - i >= 3 ? "old" : ""}`} style={{ "--i": shown - 1 - i } as React.CSSProperties}>
                  <img loading="lazy" decoding="async" src={n.icon} alt="" width={360} height={360} className="ios-icon" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold uppercase tracking-[.02em] text-black/50">{n.app}</span>
                      <span className="shrink-0 text-[13px] text-black/40">ahora</span>
                    </span>
                    <span className="mt-0.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-[15px] font-semibold text-[#1d1d1f]">{n.title}</span>
                      {n.amount && <span className="shrink-0 text-[15px] font-semibold tabular-nums text-[#1d1d1f]">{n.amount}</span>}
                    </span>
                    <span className="block truncate text-[14px] text-black/55">{n.text}</span>
                    {n.pdf && (
                      <span className="mt-2 inline-flex items-center gap-2 rounded-[10px] bg-black/[.05] px-2.5 py-1.5 text-[13px] text-black/70">
                        <span className="grid h-6 w-5 place-items-center rounded-[3px] bg-[#E5322D] text-[7px] font-bold text-white">PDF</span>
                        Factura-B-0001-00004821.pdf
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Verbo que rota con el color de marca de cada acción.
const VERBS = [
  { w: "Vendé.", c: "linear-gradient(90deg,#FF4B22,#FF8A1F)" },
  { w: "Cobrá.", c: "linear-gradient(90deg,#FF3D7F,#7C4DFF)" },
  { w: "Publicá.", c: "linear-gradient(90deg,#F5B400,#FF8A1F)" },
  { w: "Facturá.", c: "linear-gradient(90deg,#3D68FF,#00B1EA)" },
];

function RotatingVerb() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % VERBS.length), 2200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span aria-hidden className="verb-slot">
      {VERBS.map((v, k) => (
        <span
          key={v.w}
          className={`verb ${k === i ? "on" : k === (i + VERBS.length - 1) % VERBS.length ? "out" : ""}`}
          style={{ backgroundImage: v.c }}
        >
          {v.w}
        </span>
      ))}
    </span>
  );
}
