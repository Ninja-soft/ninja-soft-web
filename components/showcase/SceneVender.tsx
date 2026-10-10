"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { panel, Spinner, T } from "./ui";

// Vendé: un carrito por rubro (rota en cada aparición) y un selector de medio
// de pago: el resaltado recorre las marcas, elige una al azar, cobra y aprueba.

const CARTS = [
  {
    rubro: "Electro",
    plan: "12 cuotas",
    total: "$ 1.467.900",
    items: [
      { img: "/images/products/headphones.webp", name: "Auriculares inalámbricos", qty: 1, price: "$ 89.900" },
      { img: "/images/products/watch.webp", name: "Reloj smart", qty: 1, price: "$ 129.000" },
      { img: "/images/products/laptop.webp", name: "Notebook 14 pulgadas", qty: 1, price: "$ 1.249.000" },
    ],
  },
  {
    rubro: "Gastronomía",
    plan: "1 pago",
    total: "$ 30.700",
    items: [
      { img: "/images/products/coffee.webp", name: "Café con leche", qty: 2, price: "$ 6.400" },
      { img: "/images/products/burger.webp", name: "Hamburguesa doble", qty: 1, price: "$ 9.800" },
      { img: "/images/products/pizza.webp", name: "Pizza especial", qty: 1, price: "$ 14.500" },
    ],
  },
  {
    rubro: "Indumentaria",
    plan: "6 cuotas",
    total: "$ 219.900",
    items: [
      { img: "/images/products/jacket.webp", name: "Campera de cuero", qty: 1, price: "$ 159.000" },
      { img: "/images/products/sweater.webp", name: "Sweater tejido", qty: 1, price: "$ 42.000" },
      { img: "/images/products/tshirt.webp", name: "Remera básica", qty: 1, price: "$ 18.900" },
    ],
  },
];

// Selector de medio de pago tipo checkout: logos legibles sobre vidrio oscuro,
// cada opción se enciende con el color de su marca. `btn` = botón final de cobro.
const PAY = [
  { key: "mp", src: "/images/payments/processors/mercadopago.webp", alt: "Mercado Pago", h: 22, brand: "#00B1EA",
    btn: { bg: "linear-gradient(135deg,#EAF8FF,#B9E8FF)", logo: "/images/payments/processors/mercadopago.webp", h: 22, dark: true } },
  { key: "modo", src: "/images/payments/processors/modo.webp", alt: "MODO", h: 14, brand: "#19C37D",
    btn: { bg: "linear-gradient(135deg,#1FCB86,#04945A)", logo: "/images/payments/processors/modo-white.webp", h: 14 } },
  { key: "nave", src: "/images/payments/processors/nave-dark.webp", alt: "Nave", h: 16, brand: "#9B5CFF",
    btn: { bg: "linear-gradient(135deg,#2A2A36,#0B0B10)", logo: "/images/payments/processors/nave-dark.webp", h: 16 } },
  { key: "payway", src: "/images/payments/processors/payway.webp", alt: "Payway", h: 14, brand: "#3D68FF",
    btn: { bg: "linear-gradient(135deg,#3D68FF,#0026C9)", logo: "/images/payments/processors/payway-white.webp", h: 14 } },
  { key: "getnet", src: "/images/payments/processors/getnet.webp", alt: "Getnet", h: 15, brand: "#FF2D2D",
    btn: { bg: "linear-gradient(135deg,#FF3B3B,#C40000)", logo: "/images/payments/processors/getnet-white.webp", h: 15 } },
];
export const VENDER_IMAGES = [
  ...CARTS.flatMap((c) => c.items.map((i) => i.img)),
  ...PAY.flatMap((p) => [p.src, p.btn.logo]),
];

// Línea de tiempo
const SCAN_START = 500; // el resaltado empieza a recorrer las opciones
const SCAN_SLOT = 520;
const PICK_AT = SCAN_START + PAY.length * SCAN_SLOT; // queda elegida una
const BUTTON_AT = PICK_AT + 450;
const PROCESS_AT = BUTTON_AT + 1100;
const APPROVED_AT = PROCESS_AT + 1200;

// Cada vez que se muestra "Vendé" pasa al siguiente rubro.
let cartTurn = -1;
// Medio de pago elegido al azar en cada pasada.
let lastPay = -1;

export function SceneVender() {
  const [cart] = useState(() => {
    cartTurn = (cartTurn + 1) % CARTS.length;
    return CARTS[cartTurn];
  });
  const [chosen] = useState(() => {
    let i = Math.floor(Math.random() * PAY.length);
    if (i === lastPay) i = (i + 1) % PAY.length; // nunca el mismo dos veces seguidas
    lastPay = i;
    return PAY[i];
  });

  return (
    <div className={panel}>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {CARTS.map((c) => (
          <span
            key={c.rubro}
            className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
              c.rubro === cart.rubro ? "bg-white text-[#100A2E]" : "bg-white/[.06] text-mist"
            }`}
          >
            {c.rubro}
          </span>
        ))}
      </div>
      <ul className="grid gap-2">
        {cart.items.map((c, i) => (
          <li key={c.name} className="sc-up flex items-center gap-3" style={T(i * 120)}>
            <img src={c.img} alt="" width={320} height={320} className="h-11 w-11 rounded-xl object-cover" />
            <span className="min-w-0 flex-1 truncate text-[14px]">
              {c.name} <span className="text-mist">× {c.qty}</span>
            </span>
            <span className="font-mono text-[13px] tabular-nums">{c.price}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-white/10 pt-3">
        <p className="text-[11px] uppercase tracking-[.14em] text-mist">Total · {cart.plan}</p>
        <p className="font-display text-[28px] font-bold leading-none tabular-nums">{cart.total}</p>
      </div>

      <p className="mt-3 text-[11px] uppercase tracking-[.14em] text-mist">Elegí cómo cobrar</p>
      <ul className="mt-1.5 grid grid-cols-5 gap-1.5">
        {PAY.map((p, i) => (
          <li
            key={p.key}
            className={`pm-tile flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] px-1.5 ${p.key === chosen.key ? "pm-chosen" : ""}`}
            style={
              {
                "--brand": p.brand,
                "--d": `${SCAN_START + i * SCAN_SLOT}ms`,
                "--slot": `${SCAN_SLOT * 1.6}ms`,
                "--pick": `${PICK_AT}ms`,
              } as React.CSSProperties
            }
          >
            <img src={p.src} alt={p.alt} className="relative z-[1] w-auto max-w-full object-contain" style={{ height: p.h }} />
          </li>
        ))}
      </ul>

      <div className="relative mt-2.5 h-12 overflow-hidden rounded-full bg-white/[.04]">
        <span
          className="sc-window absolute inset-0 flex items-center justify-center gap-2.5 overflow-hidden"
          style={{ background: chosen.btn.bg, ...T(BUTTON_AT), animationDuration: `${PROCESS_AT - BUTTON_AT}ms` }}
        >
          <span className={`text-[14px] font-semibold ${"dark" in chosen.btn ? "text-[#1E2A78]" : "text-white"}`}>Cobrar {cart.total} con</span>
          <img src={chosen.btn.logo} alt={chosen.alt} className="w-auto" style={{ height: chosen.btn.h }} />
          <span
            aria-hidden
            className="sc-shine absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={T(BUTTON_AT + 250)}
          />
        </span>
        <span
          className="sc-window absolute inset-0 flex items-center justify-center gap-2.5 text-[14px]"
          style={{ background: chosen.btn.bg, ...T(PROCESS_AT), animationDuration: `${APPROVED_AT - PROCESS_AT}ms` }}
        >
          <Spinner className={"dark" in chosen.btn ? "border-[#1E2A78]/20" : ""} />{" "}
          <span className={"dark" in chosen.btn ? "text-[#1E2A78]" : ""}>Procesando pago…</span>
        </span>
        <span
          className="sc-from absolute inset-0 flex items-center justify-center gap-2 bg-[#1FA855] text-[14px] font-semibold"
          style={T(APPROVED_AT)}
        >
          <CheckCircle size={20} weight="fill" /> Pago aprobado
        </span>
      </div>
    </div>
  );
}
