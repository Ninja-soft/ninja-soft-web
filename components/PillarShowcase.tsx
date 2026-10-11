import {
  CheckCircle,
  LockKey,
  ShieldCheck,
  UserCircle,
} from "@phosphor-icons/react";
import type { PillarKey } from "./HeroPillars";
import { INTEGRAR_IMAGES, SceneIntegrar } from "./showcase/SceneIntegrar";
import { SceneML } from "./showcase/SceneML";
import { SceneVender, VENDER_IMAGES } from "./showcase/SceneVender";
import { panel, Spinner, T } from "./showcase/ui";

// Vitrina oscura del hero: cada pilar cuenta una mini historia con datos de ejemplo.
// Se re-monta en cada cambio (key) y su línea de tiempo vive en CSS (animation-delay).
// Rendimiento: sólo se anima transform y opacity (GPU); nada de filtros ni sombras animadas.


// Todas las imágenes de las escenas, para precargarlas y que el cambio de pilar no se trabe.
export const SCENE_IMAGES = [
  ...INTEGRAR_IMAGES,
  ...VENDER_IMAGES,
  "/images/brand/ninja-isotipo-flame.webp",
  "/images/integrations/mercadolibre.webp",
  "/images/products/backpack.webp",
  "/images/products/headphones.webp",
  "/images/products/tshirt.webp",
  "/images/products/sunglasses.webp",
];

export function PillarShowcase({ active, title, desc }: { active: PillarKey; title: string; desc: string }) {
  return (
    <div className="relative isolate flex flex-col sm:min-h-[540px] overflow-hidden bg-night px-4 py-6 text-snow [contain:layout_paint] sm:rounded-[26px] sm:p-7 lg:h-[540px]">
      <div
        aria-hidden
        className={`absolute inset-0 -z-10 ${
          active === "ml"
            ? "bg-[radial-gradient(60%_55%_at_85%_0%,rgba(255,230,0,.20),transparent_70%),radial-gradient(50%_50%_at_0%_100%,rgba(52,131,250,.18),transparent_70%)]"
            : "bg-[radial-gradient(60%_55%_at_85%_0%,rgba(255,106,26,.20),transparent_70%),radial-gradient(50%_50%_at_0%_100%,rgba(109,74,255,.24),transparent_70%)]"
        }`}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:22px_22px]" />

      <div key={active} className="sc-in flex flex-1 flex-col">
        <p className="font-mono text-[12px] uppercase tracking-[.16em] text-mist">{title}</p>
        <p className="mt-2 max-w-[36ch] font-display text-[21px] font-bold leading-snug">{desc}</p>
        <div className="mt-5 flex flex-1 flex-col sm:justify-end">{SCENES[active]}</div>
      </div>
    </div>
  );
}

/* ---------- 4. Controlá: KPIs + curva que se dibuja + más vendidos ---------- */

const TOP = [
  { img: "/images/products/headphones.webp", name: "Auriculares", pct: 92 },
  { img: "/images/products/tshirt.webp", name: "Remera básica", pct: 74 },
  { img: "/images/products/sunglasses.webp", name: "Anteojos de sol", pct: 58 },
];

function SceneControlar() {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className={panel}>
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[.14em] text-mist">Ventas hoy</p>
            <p className="font-display text-[28px] font-bold leading-none tabular-nums">$ 842.300</p>
          </div>
          <span className="sc-pop rounded-full bg-[#30D158]/15 px-2.5 py-1 text-[13px] font-semibold text-[#5BE38A]" style={T(900)}>
            +12,4 %
          </span>
        </div>
        <svg aria-hidden viewBox="0 0 200 70" className="mt-3 h-24 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FF7A2E" stopOpacity=".35" />
              <stop offset="1" stopColor="#FF7A2E" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="sc-fade" d="M0 58 L25 50 L50 54 L75 38 L100 42 L125 26 L150 30 L175 14 L200 8 L200 70 L0 70 Z" fill="url(#area)" style={T(700)} />
          <path
            className="sc-draw"
            d="M0 58 L25 50 L50 54 L75 38 L100 42 L125 26 L150 30 L175 14 L200 8"
            fill="none"
            stroke="#FF7A2E"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={100}
          />
        </svg>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-mist">
          <span>Ticket promedio <b className="block text-[15px] text-snow tabular-nums">$ 18.450</b></span>
          <span>Margen <b className="block text-[15px] text-snow tabular-nums">38 %</b></span>
        </div>
      </div>
      <div className={panel}>
        <p className="text-[11px] uppercase tracking-[.14em] text-mist">Más vendidos</p>
        <ul className="mt-2 grid gap-2.5">
          {TOP.map((t, i) => (
            <li key={t.name} className="sc-up flex items-center gap-2.5" style={T(300 + i * 150)}>
              <img src={t.img} alt="" width={320} height={320} className="h-9 w-9 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px]">{t.name}</span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/10">
                  <span className="sc-grow block h-full rounded-full bg-flame" style={{ width: `${t.pct}%`, ...T(500 + i * 150) }} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- 5. Protegé: acción sensible que pide autorización ---------- */

function SceneProteger() {
  return (
    <div className="grid gap-3">
      <div className={panel}>
        <div className="sc-up flex items-center gap-3">
          <UserCircle size={34} weight="duotone" className="shrink-0 text-mist" />
          <p className="text-[14px]">
            <b className="font-semibold">Juan (cajero)</b> quiere anular la venta <span className="font-mono">#1042</span> por{" "}
            <span className="tabular-nums">$ 48.900</span>
          </p>
        </div>
        <div className="relative mt-3 h-11 overflow-hidden rounded-xl">
          <span className="sc-window absolute inset-0 flex items-center gap-2.5 rounded-xl bg-white/[.06] px-3 text-[13.5px]" style={{ ...T(500), animationDuration: "2600ms" }}>
            <LockKey size={18} weight="duotone" className="text-[#FF7A2E]" /> Requiere autorización del encargado <Spinner className="ml-auto" />
          </span>
          <span className="sc-from absolute inset-0 flex items-center gap-2.5 rounded-xl bg-[#1FA855]/15 px-3 text-[13.5px] text-[#7CF0A6]" style={T(3100)}>
            <CheckCircle size={18} weight="fill" /> Autorizado por María con PIN · 14:32
          </span>
        </div>
      </div>
      <ul className="grid grid-cols-3 gap-2 text-center text-[12px]">
        {["Permisos por rol", "Auditoría completa", "Datos cifrados"].map((b, i) => (
          <li key={b} className="sc-up rounded-xl border border-white/10 bg-white/[.04] px-2 py-3" style={T(3600 + i * 150)}>
            <ShieldCheck size={22} weight="duotone" className="mx-auto mb-1 text-[#FF7A2E]" />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- 6. A medida: código que se escribe y se despliega ---------- */

const CODE = [
  <span key="a">
    <span className="text-[#FF7A2E]">ninja</span>.<span className="text-[#FFD21F]">integrar</span>({"{"}
  </span>,
  <span key="b" className="pl-5">
    erp: <span className="text-[#5BE38A]">&quot;tu-sistema&quot;</span>,
  </span>,
  <span key="c" className="pl-5">
    marketplace: <span className="text-[#5BE38A]">&quot;mercadolibre&quot;</span>,
  </span>,
  <span key="d" className="pl-5">
    logistica: <span className="text-[#5BE38A]">&quot;andreani&quot;</span>,
  </span>,
  <span key="e">{"})"}</span>,
];

function SceneMedida() {
  return (
    <div className={`${panel} font-mono text-[13px] leading-relaxed`}>
      <p className="text-mist">{"// ¿no existe? lo construimos"}</p>
      {CODE.map((line, i) => (
        <p key={i} className="sc-type" style={T(200 + i * 420)}>
          {line}
        </p>
      ))}
      <div className="relative mt-3 h-10 overflow-hidden rounded-xl">
        <span className="sc-window absolute inset-0 flex items-center gap-2.5 rounded-xl bg-white/[.06] px-3" style={{ ...T(2500), animationDuration: "1800ms" }}>
          <Spinner /> desplegando…
        </span>
        <span className="sc-from absolute inset-0 flex items-center gap-2.5 rounded-xl bg-[#1FA855]/15 px-3 text-[#7CF0A6]" style={T(4300)}>
          <CheckCircle size={18} weight="fill" /> Integración en producción
        </span>
      </div>
    </div>
  );
}

const SCENES: Record<PillarKey, React.ReactNode> = {
  integrar: <SceneIntegrar />,
  vender: <SceneVender />,
  ml: <SceneML />,
  controlar: <SceneControlar />,
  proteger: <SceneProteger />,
  medida: <SceneMedida />,
};
