import { T } from "./ui";

// Integrá: 3 etapas (pagos → logística → plataformas) orbitando el hub de Ninja.
// Corre en bucle 1 → 2 → 3 → 1. Logos "-dark" = variantes legibles sobre fondo oscuro.

type Logo = { src: string; alt: string; h: number };

const GROUPS: { label: string; logos: Logo[] }[] = [
  {
    label: "Medios de pago",
    logos: [
      { src: "/images/payments/processors/mercadopago.webp", alt: "Mercado Pago", h: 30 },
      { src: "/images/payments/processors/modo.webp", alt: "MODO", h: 18 },
      { src: "/images/payments/processors/payway.webp", alt: "Payway", h: 18 },
      { src: "/images/payments/processors/getnet.webp", alt: "Getnet", h: 18 },
      { src: "/images/payments/processors/nave-dark.webp", alt: "Nave", h: 20 },
      { src: "/images/payments/processors/fiserv.webp", alt: "Fiserv", h: 20 },
      { src: "/images/payments/processors/mobbex.webp", alt: "Mobbex", h: 16 },
      { src: "/images/payments/processors/pagos360.webp", alt: "Pagos360", h: 18 },
    ],
  },
  {
    label: "Logística",
    logos: [
      { src: "/images/logistics/correoargentino-dark.webp", alt: "Correo Argentino", h: 22 },
      { src: "/images/logistics/andreani.webp", alt: "Andreani", h: 14 },
      { src: "/images/logistics/oca.webp", alt: "OCA", h: 16 },
      { src: "/images/logistics/andesmar-dark.webp", alt: "Andesmar Cargas", h: 16 },
      { src: "/images/logistics/pickit.webp", alt: "Pickit", h: 20 },
      { src: "/images/logistics/hop.webp", alt: "HOP", h: 26 },
      { src: "/images/logistics/cabify.webp", alt: "Cabify Logistics", h: 20 },
    ],
  },
  {
    label: "Plataformas y delivery",
    logos: [
      { src: "/images/integrations/mercadolibre.webp", alt: "Mercado Libre", h: 30 },
      { src: "/images/integrations/vtex.webp", alt: "VTEX", h: 18 },
      { src: "/images/integrations/producteca.webp", alt: "Producteca", h: 18 },
      { src: "/images/integrations/nubceo.webp", alt: "Nubceo", h: 15 },
      { src: "/images/integrations/pedidosya.webp", alt: "PedidosYa", h: 30 },
      { src: "/images/integrations/rappi.webp", alt: "Rappi", h: 30 },
      { src: "/images/integrations/ubereats-dark.webp", alt: "Uber Eats", h: 30 },
    ],
  },
];

// Ciclo en bucle: cada etapa ocupa un tercio del ciclo. Los logos salen
// disparados desde el hub a su lugar, se quedan, y vuelven a ser absorbidos.
export const INTEGRAR_PHASE_MS = 3000;
export const INTEGRAR_CYCLE_MS = INTEGRAR_PHASE_MS * GROUPS.length;

// Las líneas van del borde del hub hasta antes del logo, así nunca lo cruzan.
const LINE_FROM = 0.34;
const LINE_TO = 0.66;

export const INTEGRAR_IMAGES = GROUPS.flatMap((g) => g.logos.map((l) => l.src));

// Elipse alrededor del hub (centro 50% / 50%), en % del contenedor.
const orbit = (i: number, n: number) => {
  const a = ((i / n) * 360 - 90) * (Math.PI / 180);
  // redondeo: evita diferencias de coma flotante entre servidor y cliente (hydration)
  const r = (v: number) => Math.round(v * 100) / 100;
  return { x: r(Math.cos(a) * 36), y: r(Math.sin(a) * 40) };
};

export function SceneIntegrar() {
  const cycle = { animationDuration: `${INTEGRAR_CYCLE_MS}ms` };
  return (
    <div className="w-full">
      {/* etiqueta de la etapa: en su propia línea, nunca encima de los logos */}
      <div className="grid h-7 [&>*]:[grid-area:1/1]">
        {GROUPS.map((g, gi) => (
          <span
            key={g.label}
            className="integ-group inline-flex w-max items-center gap-1.5 rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-[12px] font-semibold"
            style={{ ...cycle, ...T(gi * INTEGRAR_PHASE_MS) }}
          >
            <span className="font-mono text-[#FF7A2E]">{gi + 1}/3</span> {g.label}
          </span>
        ))}
      </div>
    {/* container-type: size habilita cqw/cqh para posicionar los logos con transform */}
    <div className="relative mt-2 h-[240px] w-full [container-type:size] sm:h-[270px]">
      {GROUPS.map((g, gi) => {
        const start = gi * INTEGRAR_PHASE_MS;
        return (
          <div key={g.label} className="integ-group absolute inset-0" style={{ ...cycle, ...T(start) }}>
            <svg aria-hidden viewBox="-50 -50 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              {g.logos.map((l, i) => {
                const o = orbit(i, g.logos.length);
                return (
                  <line
                    key={l.alt}
                    x1={o.x * LINE_FROM}
                    y1={o.y * LINE_FROM}
                    x2={o.x * LINE_TO}
                    y2={o.y * LINE_TO}
                    pathLength={100}
                    stroke="url(#ninja-flow)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                    className="integ-line"
                    style={{ ...cycle, ...T(start + 80 + i * 60) }}
                  />
                );
              })}
            </svg>
            {g.logos.map((l, i) => {
              const o = orbit(i, g.logos.length);
              return (
                <img
                  key={l.alt}
                  src={l.src}
                  alt={l.alt}
                  decoding="async"
                  className="integ-logo absolute left-1/2 top-1/2 w-auto max-w-[84px] object-contain sm:max-w-[110px]"
                  style={
                    {
                      height: l.h,
                      "--tx": `${o.x}cqw`,
                      "--ty": `${o.y}cqh`,
                      ...cycle,
                      ...T(start + i * 60),
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>
        );
      })}

      {/* hub central: late cada vez que absorbe/emite una etapa */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span aria-hidden className="sc-ping absolute inset-[-14px] rounded-full border border-[#FF7A2E]/40" />
        <span aria-hidden className="sc-ping absolute inset-[-14px] rounded-full border border-[#FF7A2E]/30" style={T(900)} />
        <div
          className="integ-hub relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#170F36] ring-1 ring-white/10"
          style={{ animationDuration: `${INTEGRAR_PHASE_MS}ms` }}
        >
          <img src="/images/brand/ninja-isotipo-flame.webp" alt="Ninja Soft" width={240} height={311} className="h-11 w-auto" />
        </div>
      </div>

      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="ninja-flow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF7A2E" stopOpacity=".9" />
            <stop offset="1" stopColor="#B14DFF" stopOpacity=".9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    </div>
  );
}
