import {
  Barcode,
  CalendarCheck,
  ChartBar,
  ClipboardText,
  CookingPot,
  FileXls,
  Package,
  QrCode,
  SealCheck,
  ShieldCheck,
  Snowflake,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { FoodFlow } from "@/components/food/FoodFlow";
import { FOOD_APP_URL } from "@/lib/content";

// Ninja Food: el recorrido completo del lote (canvas tipo n8n) y todo lo que resuelve.
const FEATURES: { Icon: Icon; title: string; desc: string }[] = [
  { Icon: QrCode, title: "Trazabilidad lote a lote", desc: "De la materia prima al cliente, con QR público para el consumidor." },
  { Icon: ClipboardText, title: "Planillas de producción", desc: "Individuales, masivas y semanales en PDF, con firma por PIN." },
  { Icon: CookingPot, title: "Producción desde la receta", desc: "Lotes asignados por vencimiento (FEFO), rendimiento y costos." },
  { Icon: Package, title: "Stock e insumos", desc: "Ingresos con lote, factura y proveedor. Alertas de stock bajo." },
  { Icon: Snowflake, title: "Congelados y vencimientos", desc: "Vida útil, maduración y regla CAA de congelados calculadas solas." },
  { Icon: Barcode, title: "Rótulos y códigos de barras", desc: "GS1-128 y QR en 4 tamaños, octógonos de la Ley 27.642 y RNPA." },
  { Icon: ShieldCheck, title: "BPM, POES y habilitaciones", desc: "RNE, RNPA y transporte UTA con vencimientos y avisos." },
  { Icon: Truck, title: "Despachos y recall", desc: "Remitos, clientes y retiro de mercado de un lote en un clic." },
  { Icon: FileXls, title: "Excel de ida y vuelta", desc: "Importá despachos y exportá inventario, ingresos y producciones." },
  { Icon: ChartBar, title: "Reportes y KPIs", desc: "Producción, mermas, vencimientos y cumplimiento en un tablero." },
  { Icon: CalendarCheck, title: "Planillas programadas", desc: "Controles con frecuencia, responsables y recordatorios." },
  { Icon: SealCheck, title: "Aval técnico de ABR", desc: "Respaldo de Asesoría Bromatológica Rosario en cada traza." },
];

export function FoodSection() {
  return (
    <section id="food" className="tile rise food-bg !pb-12 sm:!pb-16">
      <img loading="lazy" decoding="async" src="/images/brand/ninjafood-logo-light.webp" alt="Ninja Food" width={640} height={142} className="mx-auto mb-5 h-11 w-auto max-w-full" />
      <h2 className="tile-title">Cada lote, trazado de punta a punta.</h2>
      <p className="tile-sub text-ink-2">
        Trazabilidad y gestión bromatológica para la industria alimenticia: desde que entra la materia prima hasta que el producto llega al cliente.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-8">
        <a href="#hablemos" className="inline-flex min-h-[44px] items-center text-[17px] text-food hover:underline">
          Pedir una demo&nbsp;›
        </a>
        <a href={FOOD_APP_URL} className="inline-flex min-h-[44px] items-center text-[17px] text-food hover:underline">
          Ingresar&nbsp;›
        </a>
      </div>

      <FoodFlow />

      <ul className="mx-auto mt-10 grid max-w-[1100px] gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex gap-3 rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_22px_rgba(0,0,0,.04)]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[linear-gradient(135deg,#16a34a,#4ade80)] text-white">
              <f.Icon size={21} weight="fill" />
            </span>
            <span className="min-w-0">
              <b className="block text-[15px] font-semibold leading-tight">{f.title}</b>
              <span className="mt-1 block text-[13.5px] leading-snug text-ink-2">{f.desc}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
