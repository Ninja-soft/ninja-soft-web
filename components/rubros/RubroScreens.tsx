import {
  Bell,
  ShoppingBag,
  CalendarDots,
  CheckCircle,
  Clock,
  Moped,
  Printer,
  Receipt,
  Scan,
  Timer,
  Users,
} from "@phosphor-icons/react";

// Pantallas por rubro: interfaz NinjaPOS (ninja-dark) recreada en HTML con una
// línea de tiempo de animaciones por escena (CSS, sólo transform/opacity).
// Las escenas se re-montan al cambiar de rubro, así la historia arranca de cero.
// Regla visual: nada de bordes de color redondeados; los estados se marcan con
// fondos tintados, puntos y chips.

const P = (n: string) => `/images/products/${n}.webp`;
const D = (ms: number) => ({ animationDelay: `${ms}ms` }) as React.CSSProperties;
const muted = "text-[#a99fd0]";
const glass = "rounded-[18px] bg-white/[.045] ring-1 ring-white/[.07]";

function Head({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
        {sub && <p className={`${muted} text-[11.5px]`}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function Chip({ children, tone = "neutral", style, className = "" }: { children: React.ReactNode; tone?: "neutral" | "ok" | "warn" | "flame" | "violet"; style?: React.CSSProperties; className?: string }) {
  const t = {
    neutral: "bg-white/[.07] text-white/80",
    ok: "bg-[#30D158]/[.16] text-[#7cf0a6]",
    warn: "bg-[#FFD21F]/[.14] text-[#ffe37a]",
    flame: "bg-[#FF4B22]/[.18] text-[#ffb08a]",
    violet: "bg-[#7C4DFF]/[.2] text-[#c9b6ff]",
  }[tone];
  return (
    <span style={style} className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${t} ${className}`}>
      {children}
    </span>
  );
}

const total = "bg-[linear-gradient(135deg,#ff4b22,#ff3d7f_50%,#7c4dff)] bg-clip-text text-transparent font-black tabular-nums";

/* =========================================================================
   GASTRONOMÍA · salón (mesas) + cocina + apps de delivery
   ========================================================================= */
type TS = "libre" | "ocupada" | "cuenta" | "reservada";
// Mismos tonos que el POS (modules/dining TABLE_STATUS_TILE / DOT).
const TILE: Record<TS, { tile: string; dot: string; label: string }> = {
  libre: { tile: "border-[#FF4B22]/40 bg-[#FF4B22]/[.07]", dot: "bg-[#FF4B22]", label: "Libre" },
  ocupada: { tile: "border-amber-400/40 bg-amber-400/[.08]", dot: "bg-amber-400", label: "Ocupada" },
  cuenta: { tile: "border-sky-400/40 bg-sky-400/[.08]", dot: "bg-sky-400", label: "Cuenta pedida" },
  reservada: { tile: "border-purple-400/40 bg-purple-400/[.08]", dot: "bg-purple-400", label: "Reservada" },
};
const TABLES: { n: string; st: TS; seats: number; total?: string }[] = [
  { n: "Mesa 1", st: "ocupada", seats: 2, total: "$ 12.400" },
  { n: "Mesa 2", st: "libre", seats: 2 },
  { n: "Mesa 3", st: "cuenta", seats: 4, total: "$ 31.900" },
  { n: "Mesa 4", st: "ocupada", seats: 4, total: "$ 42.300" },
  { n: "Mesa 5", st: "reservada", seats: 6 },
  { n: "Mesa 6", st: "libre", seats: 2 },
  { n: "Barra 1", st: "ocupada", seats: 1, total: "$ 5.800" },
  { n: "Barra 2", st: "libre", seats: 1 },
];
const ORDERS = [
  { from: "rappi", id: "Rappi #4821", items: "Pizza especial · Ensalada", eta: 6, img: "pizza" },
  { from: "pedidosya", id: "PedidosYa #772", items: "3 Hamburguesas · Papas", eta: 9, img: "burger" },
  { from: "ubereats-dark", id: "Uber Eats #318", items: "2 Papas fritas · Té helado", eta: 4, img: "papas-fritas" },
];
export function ScreenGastro() {
  return (
    <div className="grid h-full grid-cols-[1.15fr_1fr] gap-4">
      {/* Salón: igual al del POS */}
      <div className={`${glass} flex flex-col p-4`}>
        <Head title="Salón principal" sub="4 mesas abiertas · $ 92.400 en curso" right={<Chip tone="ok">● En servicio</Chip>} />
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/60">
          {(Object.keys(TILE) as TS[]).map((k) => (
            <span key={k} className="flex items-center gap-1">
              <i className={`h-2 w-2 rounded-full ${TILE[k].dot}`} />
              {TILE[k].label}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {TABLES.map((t, i) => (
            <div
              key={t.n}
              className={`rb-in flex aspect-[4/3] flex-col justify-between rounded-[12px] border p-2.5 ${TILE[t.st].tile} ${t.n === "Mesa 4" ? "rb-focus" : ""}`}
              style={D(60 * i)}
            >
              <div className="flex items-start justify-between">
                <b className="text-[13px] font-bold tracking-tight">{t.n}</b>
                <i className={`mt-1 h-2 w-2 rounded-full ${TILE[t.st].dot}`} />
              </div>
              <div>
                <span className="flex items-center gap-1 text-[10px] text-white/55">
                  <Users size={11} /> {t.seats}
                </span>
                {t.total ? (
                  <span className={`${total} block text-[12.5px]`}>{t.total}</span>
                ) : (
                  <span className="block text-[10px] font-medium text-[#FF8A5B]">{t.st === "libre" ? "Tocá para abrir" : TILE[t.st].label}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* cuenta de la mesa 4 */}
        <div className="rb-in mt-3 flex-1 rounded-[14px] bg-white/[.05] p-3" style={D(1100)}>
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] font-semibold">Cuenta · Mesa 4</p>
            <span className={`${muted} flex items-center gap-1 text-[10.5px]`}>
              <Timer size={11} weight="bold" /> 38 min · 4 personas
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              ["burger", "2 × Hamburguesa", "$ 19.600"],
              ["pizza", "1 × Pizza especial", "$ 14.500"],
              ["te-helado", "3 × Té helado", "$ 8.200"],
            ].map(([img, n, p], k) => (
              <div key={n} className="rb-in flex items-center gap-2 rounded-[10px] bg-white/[.05] p-1.5" style={D(1300 + k * 120)}>
                <img loading="lazy" decoding="async" src={P(img)} alt="" className="h-8 w-8 rounded-[8px] object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-[10.5px]">{n}</span>
                  <b className="text-[11px] tabular-nums">{p}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cocina + delivery */}
      <div className="flex min-h-0 flex-col gap-3">
        <div className={`${glass} flex min-h-0 flex-1 flex-col p-4`}>
          <Head title="Pedidos de apps" sub="Entran solos a cocina" right={<Bell size={16} weight="fill" className="rb-ring text-[#FFD21F]" />} />
          <div className="mt-3 grid gap-2">
            {ORDERS.map((o, i) => (
              <div key={o.id} className="rb-slide flex items-center gap-3 rounded-[12px] bg-white/[.05] p-2" style={D(700 + i * 700)}>
                <img loading="lazy" decoding="async" src={P(o.img)} alt="" className="h-11 w-11 rounded-[10px] object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                    <img loading="lazy" decoding="async" src={`/images/integrations/${o.from}.webp`} alt="" className="h-3.5 w-auto" />
                    {o.id}
                  </p>
                  <p className={`${muted} truncate text-[10.5px]`}>{o.items}</p>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/10">
                    <span className="rb-bar block h-full rounded-full bg-[linear-gradient(90deg,#ff4b22,#ffd21f)]" style={{ ...D(900 + i * 700), width: `${100 - o.eta * 8}%` }} />
                  </span>
                </div>
                <Chip tone="warn">{o.eta} min</Chip>
              </div>
            ))}
          </div>
        </div>
        <div className={`${glass} rb-in relative overflow-hidden`} style={D(2400)}>
          <div className="flex">
            {/* mapa */}
            <div className="relative h-[130px] w-[200px] shrink-0 overflow-hidden bg-[#140e2c]">
              <svg viewBox="0 0 200 130" className="absolute inset-0 h-full w-full" aria-hidden>
                {/* calles */}
                <g stroke="rgba(255,255,255,.07)" strokeWidth="7" fill="none">
                  <path d="M0 30 H200 M0 78 H200 M0 118 H200 M40 0 V130 M110 0 V130 M165 0 V130" />
                </g>
                <rect x="118" y="38" width="40" height="32" rx="4" fill="rgba(48,209,88,.10)" />
                {/* ruta */}
                <path d="M22 112 C 40 112, 40 78, 70 78 S 110 78, 110 55 S 140 30, 178 30" fill="none" stroke="rgba(255,122,46,.25)" strokeWidth="5" strokeLinecap="round" />
                <path className="rb-route" d="M22 112 C 40 112, 40 78, 70 78 S 110 78, 110 55 S 140 30, 178 30" fill="none" stroke="#FF7A2E" strokeWidth="3" strokeLinecap="round" pathLength={100} />
                <circle cx="22" cy="112" r="5" fill="#FF4B22" />
                <circle cx="178" cy="30" r="9" fill="rgba(48,209,88,.25)" />
                <circle cx="178" cy="30" r="5" fill="#30D158" />
              </svg>
              <span className="rb-rider absolute grid h-7 w-7 place-items-center rounded-full bg-[#FF4B22] text-white shadow-[0_0_0_4px_rgba(255,75,34,.25)]">
                <Moped size={15} weight="fill" />
              </span>
            </div>
            {/* datos */}
            <div className="flex flex-1 flex-col p-3">
              <p className="flex items-center justify-between text-[11px] text-white/60">
                Delivery propio · #1190 <Chip tone="ok">En camino</Chip>
              </p>
              <p className="mt-1 text-[24px] font-bold leading-none tabular-nums">12 min</p>
              <p className={`${muted} text-[10.5px]`}>Av. Pellegrini 1250 · 2,4 km</p>
              <div className="mt-auto flex items-center gap-2">
                <img loading="lazy" decoding="async" src={P("burger")} alt="" className="h-7 w-7 rounded-full object-cover" />
                <span className="text-[11px]">Nico · repartidor</span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {["Preparado", "Retirado", "En camino", "Entregado"].map((st, k) => (
                  <span key={st} className="grid gap-1">
                    <i className={`h-1 rounded-full ${k < 3 ? "bg-[#FF7A2E]" : "bg-white/15"} ${k === 2 ? "rb-step" : ""}`} />
                    <span className={`text-[8.5px] ${k < 3 ? "text-white/80" : "text-white/35"}`}>{st}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   RETAIL · venta con fotos → cobro
   ========================================================================= */
const R_GRID = [
  ["headphones", "Auriculares", "$ 89.900"],
  ["watch", "Reloj smart", "$ 129.000"],
  ["laptop", "Notebook 14\"", "$ 1.249.000"],
  ["backpack", "Mochila urbana", "$ 48.900"],
  ["sunglasses", "Anteojos de sol", "$ 39.900"],
  ["sweater", "Sweater tejido", "$ 42.000"],
];
const R_CART = [
  ["headphones", "Auriculares inalámbricos", "$ 89.900", "Auriculares"],
  ["watch", "Reloj smart", "$ 129.000", "Reloj smart"],
  ["backpack", "Mochila urbana 25 L", "$ 48.900", "Mochila urbana"],
];
export function ScreenRetail() {
  return (
    <div className="relative grid h-full grid-cols-[1.35fr_1fr] gap-4">
      <div className={`${glass} flex flex-col p-4`}>
        <Head title="Punto de venta" sub="Sucursal Centro · Caja 1" right={<Chip>Electrónica</Chip>} />
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {R_GRID.map(([img, n, p], i) => {
            const pick = R_CART.findIndex((c) => c[3] === n);
            return (
              <div key={n} className={`rb-in relative overflow-hidden rounded-[12px] bg-white/[.05] ${pick >= 0 ? "rb-tap" : ""}`} style={{ ...D(60 * i), ["--tap" as string]: `${700 + pick * 650}ms` }}>
                <img loading="lazy" decoding="async" src={P(img)} alt="" className="aspect-[16/10] w-full object-cover" />
                <div className="px-2.5 py-1.5">
                  <p className="truncate text-[11px] text-white/80">{n}</p>
                  <p className="text-[12.5px] font-semibold tabular-nums">{p}</p>
                </div>
                {pick >= 0 && (
                  <span className="rb-plus absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#FF4B22] text-[14px] font-bold" style={D(700 + pick * 650)}>
                    +
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className={`${glass} flex flex-col p-4`}>
        <Head title="Carrito" right={<Chip tone="violet">3 productos</Chip>} />
        <div className="mt-3 grid gap-2">
          {R_CART.map(([img, n, p], i) => (
            <div key={n} className="rb-slide flex items-center gap-2.5 rounded-[12px] bg-white/[.05] p-2" style={D(800 + i * 650)}>
              <img loading="lazy" decoding="async" src={P(img)} alt="" className="h-10 w-10 rounded-[9px] object-cover" />
              <span className="min-w-0 flex-1 truncate text-[11.5px]">{n}</span>
              <b className="text-[12px] tabular-nums">{p}</b>
            </div>
          ))}
        </div>
        <div className="rb-in mt-3 flex items-center gap-2.5 rounded-[12px] bg-[#7C4DFF]/[.14] p-2.5" style={D(2500)}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#7C4DFF] text-[12px] font-bold">LG</span>
          <span className="min-w-0 flex-1">
            <b className="block text-[11.5px]">Lucía Gómez</b>
            <span className={`${muted} block text-[10px]`}>Cliente frecuente · 12 compras</span>
          </span>
          <Chip tone="violet">−5 %</Chip>
        </div>
        <div className="mt-auto">
          <div className="flex items-end justify-between border-t border-white/10 pt-2">
            <span className={`${muted} text-[10.5px] uppercase tracking-[.12em]`}>Total · 6 cuotas</span>
            <span className="relative h-7 w-[120px]">
              {["$ 89.900", "$ 218.900", "$ 267.800"].map((v, i) => (
                <span key={v} className={`absolute right-0 text-[22px] ${total} ${i < 2 ? "rb-swap" : "rb-in"}`} style={D(800 + i * 650)}>
                  {v}
                </span>
              ))}
            </span>
          </div>
          <div className="mt-2 grid gap-1.5">
            <span className="grid h-9 place-items-center rounded-[10px] bg-[linear-gradient(180deg,#ff6a2c_0%,#ec3f17_100%)] text-[13px] font-semibold">Cobrar</span>
            <span className="rb-press flex h-9 items-center justify-center gap-2 rounded-[12px] border border-[#009ee3]/40 bg-[#009ee3]/10 text-[11.5px] font-semibold text-[#5cc7f5]" style={D(2500)}>
              <img loading="lazy" decoding="async" src="/images/payments/processors/mercadopago-icon.webp" alt="" className="h-5 w-5" /> Cobrar con QR · Mercado Pago
            </span>
            <span className="flex h-9 items-center justify-center gap-2 rounded-[12px] border border-[#00d1c1]/40 bg-[#00d1c1]/10 text-[11.5px] font-semibold text-[#2fd8cb]">
              <img loading="lazy" decoding="async" src="/images/payments/processors/modo.webp" alt="" className="h-3 w-auto" /> Cobrar con QR · MODO
            </span>
            <span className="flex h-9 items-center justify-center gap-2 rounded-[12px] bg-[#2b4a8f] text-[11.5px] font-semibold">
              <img loading="lazy" decoding="async" src="/images/payments/processors/payway-icon-white.webp" alt="" className="h-4 w-auto" /> Cobrar con link · Payway
            </span>
          </div>
        </div>
      </div>

      {/* cobro: modal del QR → aprobado → factura */}
      <div className="rb-in pointer-events-none absolute inset-0 grid place-items-center rounded-[18px] bg-[#05030d]/60 backdrop-blur-[2px]" style={D(2800)}>
        <div className="relative h-[360px] w-[340px]">
          {/* QR esperando */}
          <div className="sc-window absolute inset-0 flex flex-col items-center rounded-[18px] bg-[#15103a] p-5 text-center ring-1 ring-white/10" style={{ ...D(2900), animationDuration: "2600ms" }}>
            <p className="text-[13px] font-semibold">Cobrar con QR · Mercado Pago</p>
            <img loading="lazy" decoding="async" src="/images/payments/processors/mercadopago-icon.webp" alt="" className="mt-3 h-9 w-9" />
            <p className={`${muted} mt-2 text-[11px]`}>Total a cobrar</p>
            <p className={`${total} text-[26px]`}>$ 267.800</p>
            <div className="mt-2 rounded-[12px] bg-white p-2">
              <img loading="lazy" decoding="async" src="/images/brand/qr-demo.webp" alt="" className="h-36 w-36" />
            </div>
            <p className={`${muted} mt-3 flex items-center gap-1.5 text-[11px]`}>
              <span className="sc-spinner inline-block h-3 w-3 rounded-full border-2 border-white/15 border-t-[#FF7A2E]" /> Esperando pago…
            </p>
          </div>
          {/* aprobado */}
          <div className="sc-window absolute inset-0 flex flex-col items-center justify-center rounded-[18px] bg-[#0f2a1d] text-center ring-1 ring-[#30D158]/30" style={{ ...D(5500), animationDuration: "1200ms" }}>
            <CheckCircle size={64} weight="fill" className="text-[#30D158]" />
            <p className="mt-2 text-[18px] font-semibold">¡Pago aprobado!</p>
            <p className="text-[12px] text-white/60">Registrando la venta…</p>
          </div>
          {/* factura */}
          <div className="sc-from absolute inset-0 overflow-hidden rounded-[18px] bg-white text-left text-[#1d1d1f] shadow-[0_30px_60px_rgba(0,0,0,.5)]" style={D(6700)}>
            <div className="flex items-center gap-2.5 border-b border-black/10 px-4 py-3">
              <span className="grid h-10 w-10 place-items-center rounded-[11px] bg-[linear-gradient(135deg,#ff4b22,#ff8a1f)] text-white">
                <ShoppingBag size={22} weight="fill" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold leading-tight">Tienda Urbana</p>
                <p className="text-[9.5px] text-black/50">CUIT 30-71234567-8 · Resp. Inscripto</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-[8px] border-2 border-black text-[20px] font-black">B</span>
            </div>
            <div className="px-4 py-2.5 text-[10.5px]">
              <p className="flex justify-between text-black/60">
                <span>Factura B 0001-00004821</span>
                <span>13/10/2026</span>
              </p>
              <div className="mt-2 grid gap-1">
                {[
                  ["Auriculares inalámbricos", "$ 89.900"],
                  ["Reloj smart", "$ 129.000"],
                  ["Mochila urbana 25 L", "$ 48.900"],
                ].map(([n, v]) => (
                  <p key={n} className="flex justify-between">
                    <span>1 × {n}</span>
                    <span className="tabular-nums">{v}</span>
                  </p>
                ))}
              </div>
              <p className="mt-2 flex items-end justify-between border-t border-dashed border-black/20 pt-2">
                <span className="font-semibold">Total</span>
                <span className="text-[22px] font-black tabular-nums">$ 267.800</span>
              </p>
              <p className="text-black/55">Mercado Pago QR · 6 cuotas</p>
              <div className="mt-2 flex items-center gap-2 rounded-[10px] bg-black/[.04] p-2">
                <img loading="lazy" decoding="async" src="/images/brand/qr-demo.webp" alt="" className="h-12 w-12" />
                <p className="text-[9.5px] leading-snug text-black/60">
                  CAE 74123456789012 · Vto. 23/10/2026
                  <br />
                  Comprobante autorizado por ARCA
                </p>
              </div>
            </div>
            <p className="flex items-center justify-center gap-1.5 bg-[#30D158]/10 py-2 text-[11px] font-semibold text-[#1a8d44]">
              <CheckCircle size={14} weight="fill" /> Enviada a lucia.gomez@email.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   TEXTIL · matriz talle × color con stock + etiqueta impresa
   ========================================================================= */
const SIZES = ["36", "38", "40", "42", "44"];
const COLORS = [
  { n: "Azul", c: "#2b3a55" },
  { n: "Negro", c: "#141414" },
  { n: "Celeste", c: "#8aa0b8" },
];
const STOCK = [
  [4, 9, 12, 7, 2],
  [6, 11, 15, 8, 3],
  [0, 5, 6, 4, 1],
];
export function ScreenTextil() {
  return (
    <div className="grid h-full grid-cols-[1.4fr_1fr] gap-4">
      <div className={`${glass} flex flex-col p-4`}>
        <div className="flex gap-3">
          <img loading="lazy" decoding="async" src={P("jean")} alt="" className="rb-in h-24 w-24 rounded-[12px] object-cover" />
          <div className="min-w-0 flex-1">
            <Head title="Jean recto" sub="SKU JR-2026 · Temporada otoño" />
            <p className={`${total} mt-1 text-[22px]`}>$ 54.900</p>
            <div className="mt-1 flex gap-1.5">
              <Chip tone="ok">93 en stock</Chip>
              <Chip>3 sucursales</Chip>
            </div>
          </div>
        </div>
        <p className={`${muted} mt-3 text-[10.5px] uppercase tracking-[.12em]`}>Stock por talle y color</p>
        <div className="mt-2 grid grid-cols-[64px_repeat(5,1fr)] gap-1.5 text-center text-[11px]">
          <span />
          {SIZES.map((s) => (
            <span key={s} className="text-white/60">
              {s}
            </span>
          ))}
          {COLORS.map((col, r) => (
            <div key={col.n} className="contents">
              <span className="flex items-center gap-1.5 text-left text-white/80">
                <i className="h-3 w-3 rounded-full ring-1 ring-white/20" style={{ background: col.c }} />
                {col.n}
              </span>
              {STOCK[r].map((q, k) => {
                const sel = r === 0 && k === 2;
                return (
                  <span
                    key={k}
                    className={`rb-in grid h-8 place-items-center rounded-[8px] font-semibold tabular-nums ${sel ? "rb-sel bg-[#FF4B22] text-white" : q === 0 ? "bg-white/[.03] text-white/30" : ""}`}
                    style={{ ...D(400 + (r * 5 + k) * 40), background: sel || q === 0 ? undefined : `rgba(124,77,255,${0.08 + q / 40})` }}
                  >
                    {q}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <p className={`${muted} mt-4 text-[10.5px] uppercase tracking-[.12em]`}>Más vendidos esta semana</p>
        <div className="mt-2 flex h-14 items-end gap-2">
          {[38, 62, 100, 70, 24].map((v, k) => (
            <span key={k} className="flex flex-1 flex-col items-center gap-1">
              <span className="rb-bar w-full origin-bottom rounded-t-[6px] bg-[linear-gradient(180deg,#ff8a1f,#ff4b22)]" style={{ height: `${v * 0.4}px`, ...D(900 + k * 80) }} />
              <span className="text-[9.5px] text-white/50">{SIZES[k]}</span>
            </span>
          ))}
        </div>
        <div className="mt-auto flex gap-2 pt-3">
          {["vestido", "sweater", "tshirt", "jacket"].map((n, i) => (
            <img loading="lazy" decoding="async" key={n} src={P(n)} alt="" className="rb-in h-12 w-12 rounded-[10px] object-cover opacity-80" style={D(1200 + i * 80)} />
          ))}
          <span className={`${muted} self-center text-[10.5px]`}>+ 240 productos con variantes</span>
        </div>
      </div>

      {/* impresora de etiquetas */}
      <div className={`${glass} flex flex-col p-4`}>
        <Head title="Etiquetas" sub="Zebra · 58 mm" right={<Chip tone="flame">12 en cola</Chip>} />
        <div className="relative mt-4 flex flex-1 flex-col items-center">
          {/* cuerpo de la impresora */}
          <div className="relative z-10 w-[88%] rounded-[16px] bg-[linear-gradient(180deg,#2c2550,#1a1436)] px-3 pb-2 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_10px_24px_rgba(0,0,0,.35)]">
            <div className="flex items-center justify-between text-[10.5px] text-white/70">
              <span className="flex items-center gap-1.5">
                <Printer size={13} weight="fill" /> Imprimiendo 3 de 12
              </span>
              <span className="rb-led h-1.5 w-1.5 rounded-full bg-[#30D158] shadow-[0_0_6px_#30D158]" />
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <span className="rb-bar block h-full w-1/4 rounded-full bg-[#30D158]" style={D(600)} />
            </div>
            {/* ranura */}
            <div className="mt-2 h-[5px] rounded-full bg-black/70 shadow-[inset_0_1px_2px_rgba(0,0,0,.8)]" />
          </div>
          {/* etiqueta que sale */}
          <div className="relative -mt-[3px] w-[72%] overflow-hidden">
            <div className="rb-print relative rounded-b-[10px] bg-white px-3 pb-3 pt-2.5 text-[#111] shadow-[0_16px_30px_rgba(0,0,0,.4)]">
              {/* troquel */}
              <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#120c28]" />
              <span className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#120c28]" />
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[.16em] text-[#999]">Tienda Urbana</span>
                <span className="rounded-full bg-[#111] px-1.5 py-0.5 text-[8px] font-bold text-white">T40</span>
              </div>
              <p className="mt-0.5 text-[12.5px] font-bold leading-tight">Jean recto · Azul</p>
              <p className="mt-1 text-[22px] font-black leading-none tabular-nums">$ 54.900</p>
              <p className="text-[9px] text-[#777]">6 cuotas sin interés de $ 9.150</p>
              <div className="mt-2 border-t border-dashed border-[#ccc] pt-2">
                <div className="flex h-8 items-end justify-center gap-[1.5px]">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <span key={i} className="h-full bg-black" style={{ width: [1, 2, 1, 3, 1, 2, 2][i % 7] }} />
                  ))}
                </div>
                <p className="mt-0.5 text-center font-mono text-[8.5px] tracking-[.24em]">7790000154901</p>
              </div>
            </div>
          </div>
          <div className="mt-auto grid w-full gap-1.5 pt-3">
            {["Jean recto · T42 × 4", "Remera básica · M × 4"].map((q, k) => (
              <span key={q} className="rb-in flex items-center justify-between rounded-[10px] bg-white/[.05] px-2.5 py-1.5 text-[10.5px]" style={D(2600 + k * 150)}>
                {q}
                <span className="text-white/45">en cola</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   KIOSCOS · escaneo → ticket → vuelto
   ========================================================================= */
const K_ITEMS = [
  ["gomitas", "Gomitas 100 g", "$ 1.200"],
  ["te-helado", "2 × Té helado 500 ml", "$ 3.800"],
  ["bombones", "Bombones x6", "$ 2.600"],
];
export function ScreenKiosco() {
  return (
    <div className="grid h-full grid-cols-[1.25fr_1fr] gap-4">
      <div className={`${glass} flex flex-col p-4`}>
        <Head title="Venta rápida" sub="Escaneá o tocá un producto" right={<Chip tone="ok">Caja abierta</Chip>} />
        {/* lector */}
        <div className="relative mt-3 flex h-20 items-center justify-center overflow-hidden rounded-[12px] bg-black/40">
          <div className="flex h-12 items-end gap-[2px] opacity-90">
            {Array.from({ length: 36 }).map((_, i) => (
              <span key={i} className="h-full bg-white" style={{ width: [1, 3, 1, 2, 1, 2][i % 6] }} />
            ))}
          </div>
          <span className="rb-beam absolute inset-x-6 h-[2px] bg-[#FF3B30] shadow-[0_0_14px_#FF3B30]" />
          <span className="absolute bottom-1.5 left-3 flex items-center gap-1 font-mono text-[10.5px] text-white/70">
            <Scan size={12} weight="bold" /> 7790580123456
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            ["gomitas", "Gomitas"],
            ["te-helado", "Té helado"],
            ["bombones", "Bombones"],
            ["coffee", "Café"],
            ["papas-fritas", "Papas"],
            ["gomitas", "Gomitas 50 g"],
            ["te-helado", "Té 1 L"],
            ["bombones", "Bombones x12"],
          ].map(([img, n], i) => (
            <div key={i} className="rb-in overflow-hidden rounded-[10px] bg-white/[.05]" style={D(40 * i)}>
              <img loading="lazy" decoding="async" src={P(img)} alt="" className="aspect-square w-full object-cover" />
              <p className="truncate px-1.5 py-1 text-[10px]">{n}</p>
            </div>
          ))}
        </div>
        <div className="mt-auto grid grid-cols-4 gap-1.5 pt-3 text-center text-[10.5px]">
          {["101 Alfajor", "102 Agua", "103 Chicle", "104 Pan"].map((p) => (
            <span key={p} className="rounded-[9px] bg-white/[.06] py-2 font-semibold">
              PLU {p}
            </span>
          ))}
        </div>
      </div>
      <div className={`${glass} flex flex-col p-4`}>
        <Head title="Ticket" right={<Receipt size={16} weight="fill" className="text-white/60" />} />
        <div className="mt-3 grid gap-2">
          {K_ITEMS.map(([img, n, p], i) => (
            <div key={n} className="rb-slide flex items-center gap-2.5 rounded-[12px] bg-white/[.05] p-2" style={D(600 + i * 700)}>
              <img loading="lazy" decoding="async" src={P(img)} alt="" className="h-9 w-9 rounded-[8px] object-cover" />
              <span className="min-w-0 flex-1 truncate text-[11.5px]">{n}</span>
              <b className="text-[12px] tabular-nums">{p}</b>
            </div>
          ))}
        </div>
        <div className="rb-in mt-3 flex items-center justify-between rounded-[12px] border border-dashed border-white/15 px-2.5 py-2 text-[11px]" style={D(2300)}>
          <span>¿Sumás un alfajor triple?</span>
          <Chip tone="flame">+ $ 1.450</Chip>
        </div>
        <div className="mt-auto grid gap-2">
          <div className="flex items-end justify-between border-t border-white/10 pt-2">
            <span className={`${muted} text-[10.5px] uppercase tracking-[.12em]`}>Total</span>
            <span className={`${total} text-[24px]`}>$ 7.600</span>
          </div>
          <div className="rb-in grid grid-cols-2 gap-2 text-center" style={D(2900)}>
            <span className="rounded-[10px] bg-white/[.06] py-2">
              <span className={`${muted} block text-[10px]`}>Pagó</span>
              <b className="text-[14px] tabular-nums">$ 10.000</b>
            </span>
            <span className="rounded-[10px] bg-[#30D158]/[.18] py-2">
              <span className="block text-[10px] text-[#7cf0a6]">Vuelto</span>
              <b className="text-[14px] tabular-nums text-[#a8f5c3]">$ 2.400</b>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PROFESIONALES · agenda por profesional + confirmación por WhatsApp
   ========================================================================= */
const PROS = [
  { n: "Carla", c: "#FF6A1A" },
  { n: "Diego", c: "#9B7BFF" },
  { n: "Vale", c: "#00B1EA" },
];
const HOURS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30"];
const SLOTS = [
  { h: 0, len: 2, pro: 0, who: "Sofía M.", what: "Corte + color" },
  { h: 1, len: 1, pro: 1, who: "Martín R.", what: "Barba" },
  { h: 3, len: 2, pro: 2, who: "Lucía P.", what: "Manicura" },
  { h: 4, len: 1, pro: 1, who: "Juan C.", what: "Corte" },
  { h: 6, len: 2, pro: 0, who: "Ana G.", what: "Tratamiento facial" },
  { h: 5, len: 2, pro: 1, who: "Nuevo turno", what: "Pablo S. · Corte", fresh: true },
];
export function ScreenPro() {
  return (
    <div className="grid h-full grid-cols-[1.5fr_1fr] gap-4">
      <div className={`${glass} flex flex-col p-4`}>
        <Head title="Agenda" sub="Lunes 13 · 3 profesionales" right={<CalendarDots size={16} weight="fill" className="text-white/60" />} />
        <div className="mt-3 grid flex-1 grid-cols-[44px_repeat(3,1fr)] gap-x-2">
          <span />
          {PROS.map((p) => (
            <span key={p.n} className="flex items-center gap-1.5 pb-1 text-[11.5px] font-semibold">
              <i className="grid h-5 w-5 place-items-center rounded-full text-[10px] text-white" style={{ background: p.c }}>
                {p.n[0]}
              </i>
              {p.n}
            </span>
          ))}
          <div className="relative col-span-4 grid grid-cols-[44px_repeat(3,1fr)] gap-x-2" style={{ gridTemplateRows: `repeat(${HOURS.length}, 1fr)` }}>
            {HOURS.map((h, r) => (
              <span key={h} className={`${muted} border-t border-white/[.06] pt-0.5 text-[10px]`} style={{ gridRow: r + 1, gridColumn: 1 }}>
                {h}
              </span>
            ))}
            {SLOTS.map((s, i) => (
              <div
                key={s.who}
                className={`${s.fresh ? "rb-drop" : "rb-in"} m-[2px] overflow-hidden rounded-[10px] px-2 py-1.5`}
                style={{
                  gridColumn: s.pro + 2,
                  gridRow: `${s.h + 1} / span ${s.len}`,
                  background: s.fresh ? "linear-gradient(135deg,#ff4b22,#ff3d7f)" : `${PROS[s.pro].c}2e`,
                  ...D(s.fresh ? 1500 : 70 * i),
                }}
              >
                <b className="block truncate text-[11px]">{s.who}</b>
                <span className="block truncate text-[10px] text-white/70">{s.what}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className={`${glass} p-4`}>
          <Head title="Hoy" />
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <span className="rounded-[10px] bg-white/[.05] py-2">
              <b className="block text-[20px] tabular-nums">14</b>
              <span className={`${muted} text-[10px]`}>turnos</span>
            </span>
            <span className="rounded-[10px] bg-white/[.05] py-2">
              <b className={`block text-[20px] ${total}`}>$ 186k</b>
              <span className={`${muted} text-[10px]`}>a cobrar</span>
            </span>
          </div>
        </div>
        {/* WhatsApp */}
        <div className={`${glass} flex flex-1 flex-col p-4`}>
          <p className="flex items-center gap-1.5 text-[12px] font-semibold">
            <img loading="lazy" decoding="async" src="/images/integrations/whatsapp.webp" alt="WhatsApp" className="h-[18px] w-[18px]" /> Recordatorios
          </p>
          <div className="mt-3 grid gap-2">
            <p className="rb-slide max-w-[90%] rounded-[12px] rounded-tl-[4px] bg-white/[.07] px-3 py-2 text-[11px]" style={D(2200)}>
              Hola Pablo, te esperamos mañana 11:30 con Diego. ¿Confirmás?
            </p>
            <p className="rb-slide ml-auto max-w-[70%] rounded-[12px] rounded-tr-[4px] bg-[#25D366]/[.22] px-3 py-2 text-[11px]" style={D(3000)}>
              ¡Sí, confirmo! 👍
            </p>
            <p className="rb-in flex items-center gap-1 text-[10.5px] text-[#7cf0a6]" style={D(3500)}>
              <CheckCircle size={13} weight="fill" /> Turno confirmado
            </p>
          </div>
          <span className="mt-auto flex items-center justify-center gap-1.5 rounded-[11px] bg-[linear-gradient(180deg,#ff6a2c,#ec3f17)] py-2.5 text-[12.5px] font-semibold">
            <Clock size={14} weight="bold" /> Cobrar turno · seña $ 8.000
          </span>
        </div>
      </div>
    </div>
  );
}
