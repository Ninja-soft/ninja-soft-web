import { ArrowsClockwise, CheckCircle, Megaphone, Printer, Tag } from "@phosphor-icons/react";
import { Spinner, T } from "./ui";

// Mercado Libre: publicación a todo el ancho + 4 pasos en grilla 2x2.
// Los valores que cambian (precio, stock) se apilan en la MISMA celda de grilla
// (no position:absolute), así la altura se adapta y nunca se superponen.

const STEP_EVERY = 1500;
const STEPS = [
  { Icon: Megaphone, label: "Publicar", note: "Publicación activa" },
  { Icon: ArrowsClockwise, label: "Sincronizar stock", note: "Venta en local: 24 → 23" },
  { Icon: Printer, label: "Imprimir etiquetas", note: "Etiqueta de envío lista" },
  { Icon: Tag, label: "Central de promociones", note: "−15 % aplicado" },
];
const stockAt = 200 + 1 * STEP_EVERY + 900; // cuando termina "Sincronizar"
const promoAt = 200 + 3 * STEP_EVERY + 900; // cuando termina "Promociones"

const stack = "grid [&>*]:[grid-area:1/1]";

export function SceneML() {
  return (
    <div className="grid gap-3">
      <div className="sc-up overflow-hidden rounded-[18px] bg-white text-[#100A2E]">
        <div className="flex items-center gap-2 bg-[#FFE600] px-3.5 py-2">
          <img src="/images/integrations/mercadolibre.webp" alt="Mercado Libre" className="h-6 w-auto" />
          <span className="text-[12.5px] font-semibold text-[#2D3277]">Tu publicación</span>
          <span className="ml-auto rounded-full bg-[#2D3277] px-2 py-0.5 text-[11px] font-semibold text-white">Activa</span>
        </div>
        <div className="flex items-center gap-4 p-3.5">
          <img src="/images/products/backpack.webp" alt="" width={320} height={320} className="h-[76px] w-[76px] shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px]">Mochila urbana 25 L</p>
            <div className={`${stack} mt-0.5`}>
              <p className="sc-window whitespace-nowrap text-[20px] font-semibold tabular-nums" style={{ ...T(0), animationDuration: `${promoAt}ms` }}>
                $ 48.900
              </p>
              <p className="sc-from flex items-baseline gap-2 whitespace-nowrap" style={T(promoAt)}>
                <span className="text-[20px] font-semibold tabular-nums">$ 41.565</span>
                <span className="text-[12.5px] font-semibold text-[#00A650]">15% OFF</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px]">
              <span className="font-semibold text-[#00A650]">Envío gratis</span>
              <span className={stack}>
                <span className="sc-window whitespace-nowrap text-[#666]" style={{ ...T(0), animationDuration: `${stockAt}ms` }}>
                  Stock: 24
                </span>
                <span className="sc-from whitespace-nowrap font-semibold text-[#2D3277]" style={T(stockAt)}>
                  Stock: 23 · sincronizado
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {STEPS.map((s, i) => {
          const start = 200 + i * STEP_EVERY;
          return (
            <li key={s.label} className="sc-up flex items-center gap-2.5 rounded-xl bg-white/[.05] px-3 py-2.5" style={T(start)}>
              <s.Icon size={20} weight="duotone" className="shrink-0 text-[#FFE600]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{s.label}</span>
                <span className="block truncate text-[11.5px] text-mist">{s.note}</span>
              </span>
              <span className={`${stack} h-5 w-5 shrink-0 place-items-center`}>
                <span className="sc-window flex items-center justify-center" style={{ ...T(start), animationDuration: "900ms" }}>
                  <Spinner />
                </span>
                <span className="sc-from text-[#30D158]" style={T(start + 900)}>
                  <CheckCircle size={20} weight="fill" />
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
