import {
  Barcode,
  Basket,
  CalendarCheck,
  ChartBar,
  ChefHat,
  ForkKnife,
  CloudArrowUp,
  CreditCard,
  Cube,
  FileText,
  HandCoins,
  Moped,
  Package,
  Receipt,
  Robot,
  ShieldCheck,
  Storefront,
  ShoppingBagOpen,
  Stethoscope,
  Tag,
  TShirt,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

// Funciones: la base (8 tarjetas grandes) + un bloque por rubro.
// Mismo lenguaje que "Así trabajamos": tarjeta blanca sin borde, sombra suave
// e ícono sólido en squircle con degradé.
type F = { Icon: Icon; title: string; desc: string };

const BASE: F[] = [
  { Icon: Receipt, title: "Facturás sin salir de la venta", desc: "Factura A, B y C electrónica ante ARCA, en un clic." },
  { Icon: CreditCard, title: "Nunca más perdés una venta", desc: "QR, Point, link de pago, débito, crédito y cuotas." },
  { Icon: HandCoins, title: "La caja cierra sola", desc: "Arqueo por turno, sin diferencias ni planillas." },
  { Icon: Package, title: "Sabés qué tenés y dónde", desc: "Stock en tiempo real por sucursal y depósito." },
  { Icon: Users, title: "Clientes que vuelven", desc: "Historial, cuenta corriente y saldos al día." },
  { Icon: ChartBar, title: "Decidís con números", desc: "Ventas, márgenes y productos estrella, en vivo." },
  { Icon: ShieldCheck, title: "Tu negocio, bajo control", desc: "Permisos por rol y registro de cada acción." },
  { Icon: Robot, title: "Preguntale a tu negocio", desc: "Un asistente con IA que responde con tus datos." },
];

const RUBROS: { title: string; Icon: Icon; grad: string; items: F[] }[] = [
  {
    title: "Gastronomía",
    Icon: ForkKnife,
    grad: "linear-gradient(135deg,#ff8a1f,#ffb547)",
    items: [
      { Icon: ChefHat, title: "Cocina sin papelitos", desc: "Comandas a cada estación y salón por mesa." },
      { Icon: Moped, title: "Todas las apps, una pantalla", desc: "Rappi, PedidosYa, Uber Eats y delivery propio." },
    ],
  },
  {
    title: "Retail y textil",
    Icon: ShoppingBagOpen,
    grad: "linear-gradient(135deg,#7c4dff,#a98bff)",
    items: [
      { Icon: TShirt, title: "Talles y colores, sin caos", desc: "Cada variante con su stock." },
      { Icon: Tag, title: "Etiquetas en segundos", desc: "Códigos de barras impresos en lote." },
      { Icon: Storefront, title: "Vendé también online", desc: "Tienda y Mercado Libre, mismo stock." },
      { Icon: CloudArrowUp, title: "Arrancás hoy", desc: "Tu catálogo desde Excel en minutos." },
    ],
  },
  {
    title: "Kioscos y almacenes",
    Icon: Basket,
    grad: "linear-gradient(135deg,#12b26f,#4ad99a)",
    items: [
      { Icon: Barcode, title: "Cobrás antes que la fila crezca", desc: "Lector, PLU y botones rápidos." },
      { Icon: Cube, title: "Por peso o por unidad", desc: "Balanza y fraccionados, sin cuentas." },
    ],
  },
  {
    title: "Profesionales",
    Icon: Stethoscope,
    grad: "linear-gradient(135deg,#0a84ff,#4cc3ff)",
    items: [
      { Icon: CalendarCheck, title: "Agenda llena, cero ausencias", desc: "Turnos y recordatorio automático." },
      { Icon: FileText, title: "Cobrás por adelantado", desc: "Packs de sesiones y señas." },
    ],
  },
];

const CARD = "feat-card rounded-[24px] bg-white/[.06] text-left ring-1 ring-inset ring-white/[.08]";
const FLAME = "linear-gradient(135deg,#ff4b22,#ff8a1f)";

export function Features() {
  return (
    <section id="funciones" className="rise on-night relative overflow-hidden bg-night px-4 text-snow pb-16 pt-16 sm:rounded-tile sm:pb-24 sm:pt-20">
      <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 h-96 w-[min(1000px,130vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,106,26,.16),transparent)]" />
      <div className="relative text-center">
        <h2 className="text-[clamp(32px,5vw,56px)] font-bold leading-[1.04] tracking-[-0.03em]">
          Menos planillas.
          <br />
          <span className="text-flame">Más ventas.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-[clamp(17px,1.8vw,21px)] text-mist">
          Todo lo que hoy resolvés con tres sistemas, un cuaderno y un Excel, en una sola plataforma.
        </p>
      </div>

      <div className="relative mx-auto mt-12 max-w-[1100px]">
        <p className="mb-4 text-[13px] font-semibold uppercase tracking-[.14em] text-mist/80">Para cualquier negocio</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {BASE.map((f) => (
            <div key={f.title} className={`${CARD} flex gap-4 p-5 sm:block sm:p-6`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-white shadow-[0_8px_24px_rgba(255,75,34,.35)] sm:h-[52px] sm:w-[52px] sm:rounded-[16px]" style={{ background: FLAME }}>
                <f.Icon size={26} weight="duotone" />
              </span>
              <span className="block min-w-0 sm:mt-5">
                <b className="block text-[17px] font-bold leading-tight tracking-[-0.01em] sm:text-[19px]">{f.title}</b>
                <span className="mt-1.5 block text-[14.5px] leading-snug text-mist">{f.desc}</span>
              </span>
            </div>
          ))}
        </div>

        <p className="mb-4 mt-12 text-[13px] font-semibold uppercase tracking-[.14em] text-mist/80">Y lo de tu rubro</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {RUBROS.map((r) => (
            <div key={r.title} className={`${CARD} p-6`}>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-white" style={{ background: r.grad }}>
                  <r.Icon size={24} weight="duotone" />
                </span>
                <b className="min-w-0 text-[19px] font-bold leading-tight tracking-[-0.015em]">{r.title}</b>
              </div>
              <ul className="mt-5 divide-y divide-white/[.08]">
                {r.items.map((f) => (
                  <li key={f.title} className="py-3 first:pt-0 last:pb-0">
                    <b className="block text-[15px] font-semibold leading-tight">{f.title}</b>
                    <span className="mt-1 block text-[13.5px] leading-snug text-mist">{f.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
