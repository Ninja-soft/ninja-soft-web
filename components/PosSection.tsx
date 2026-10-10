import { POS_APP_URL } from "@/lib/content";

const CATALOG = [
  ["Alfajor triple", "$ 1.450"],
  ["Café con leche", "$ 2.900"],
  ["Medialuna", "$ 850"],
  ["Agua 500 ml", "$ 1.200"],
  ["Tostado J&Q", "$ 5.600"],
  ["Jugo naranja", "$ 3.100"],
  ["Yerba 1 kg", "$ 6.900"],
  ["Galletitas", "$ 1.980"],
  ["Chocolate", "$ 2.300"],
] as const;

// Subtotal 13.950 + 10 % de recargo del plan en 3 cuotas = 15.345.
const TICKET = [
  ["2 × Café con leche", "$ 5.800"],
  ["1 × Tostado J&Q", "$ 5.600"],
  ["3 × Medialuna", "$ 2.550"],
  ["Plan 3 cuotas · Payway", "$ 1.395"],
] as const;

export function PosSection() {
  return (
    <section id="pos" className="tile on-night rise bg-night text-snow">
      <img src="/images/brand/ninjapos-logo-dark.webp" alt="NinjaPOS" width={640} height={152} className="mx-auto mb-5 h-11 w-auto max-w-full" />
      <h2 className="tile-title">Vendé rápido. Controlá todo.</h2>
      <p className="tile-sub text-mist">
        Punto de venta omnicanal: local, tienda online, delivery y sucursales sobre el mismo stock, con todos los
        medios de pago del país.
      </p>
      <ul aria-label="Canales" className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
        {["Mostrador", "Tienda online", "Delivery", "Salón y mesas", "Multisucursal"].map((c) => (
          <li key={c} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[13px] text-snow">
            {c}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-8">
        <a href={POS_APP_URL} className="link-more">
          Probar gratis
        </a>
        <a href="#funciones" className="link-more">
          Ver funciones
        </a>
      </div>

      <div aria-hidden className="relative mx-auto mt-11 max-w-[760px]">
        <div className="rounded-t-[26px] border border-b-0 border-white/10 bg-night-device px-3.5 pt-3.5 shadow-[0_-20px_80px_rgba(255,106,26,.12)]">
          <div className="grid min-h-[300px] grid-cols-1 overflow-hidden rounded-t-[14px] bg-night-2 text-left text-sm sm:grid-cols-[1.25fr_1fr]">
            <div className="grid grid-cols-3 content-start gap-2 border-b border-white/10 p-4 sm:border-b-0 sm:border-r">
              {CATALOG.map(([name, price], i) => (
                <div
                  key={name}
                  className={`flex min-h-[66px] flex-col justify-between rounded-xl border p-2.5 ${
                    i === 1 ? "border-flame-linkDark/55 bg-flame-linkDark/10" : "border-white/10 bg-white/5"
                  }`}
                >
                  <small className="text-[11px] leading-tight text-mist">{name}</small>
                  <span className="font-mono text-xs">{price}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 p-4">
              {TICKET.map(([label, amount]) => (
                <div key={label} className="flex justify-between gap-3 text-[13px] text-mist">
                  <span>{label}</span>
                  <span className="font-mono tabular-nums text-snow">{amount}</span>
                </div>
              ))}
              <div className="mt-auto flex items-baseline justify-between border-t border-white/10 pt-3">
                <small className="text-xs uppercase tracking-[0.12em] text-mist">Total</small>
                <strong className="font-display text-[30px] font-bold tabular-nums">$ 15.345</strong>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pb-4">
                {["Efectivo", "QR", "Débito"].map((m) => (
                  <span key={m} className="rounded-[10px] border border-white/10 p-2 text-center text-xs">
                    {m}
                  </span>
                ))}
                <span className="rounded-[10px] bg-flame p-2 text-center text-xs font-semibold text-[#100A2E]">
                  Crédito · 3 cuotas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
