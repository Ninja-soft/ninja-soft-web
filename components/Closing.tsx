import {
  ArrowUpRight,
  ChatCircleDots,
  InstagramLogo,
  MapPin,
} from "@phosphor-icons/react/dist/ssr";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { Year } from "@/components/Year";
import { ADDRESS, FOOD_APP_URL, INSTAGRAM_URL, MAPS_URL, POS_APP_URL } from "@/lib/content";

// Trayectoria como lista agrupada estilo iOS: qué implementamos y de qué tipo es.
const PAST: { group: string; rows: [string, string][] }[] = [
  {
    group: "Gestión, depósito y punto de venta",
    rows: [
      ["Presea", "ERP · Neuralsoft"],
      ["Napse", "POS omnicanal"],
      ["Softland", "ERP"],
      ["Cygnus", "WMS"],
      ["Posberry", "POS"],
    ],
  },
  {
    group: "Ecommerce y pagos",
    rows: [
      ["Producteca", "Integrador de canales"],
      ["E3 Stores", "Tiendas online"],
      ["Mercado Libre", "Marketplace"],
      ["Mercado Pago", "Cobros"],
    ],
  },
];

export function Experience() {
  return (
    <section id="experiencia" className="px-4 pb-16 pt-20 sm:pb-20 sm:pt-28">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="text-center lg:text-left">
          <p className="text-[15px] font-semibold text-flame-link">Quiénes somos</p>
          <h2 className="mt-2 text-[clamp(34px,4.6vw,56px)] font-bold leading-[1.04] tracking-[-0.03em]">
            Antes de NinjaPOS, implementamos los sistemas de las grandes cadenas.
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-[clamp(17px,1.6vw,20px)] leading-snug text-ink-2 lg:mx-0">
            Programadores y project managers con años en retail, ecommerce y logística. Lo que aprendimos en cada
            implementación está en cada pantalla.
          </p>
          <a href="#hablemos" className="link-more mt-6 inline-flex">
            Contanos tu proyecto
          </a>
        </div>

        <div className="grid gap-6 text-left">
          {PAST.map((g) => (
            <div key={g.group}>
              <p className="mb-2 px-5 text-[13px] font-semibold uppercase tracking-[.12em] text-[#86868b]">{g.group}</p>
              <ul className="overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_30px_rgba(0,0,0,.05)]">
                {g.rows.map(([name, kind]) => (
                  <li key={name} className="flex items-center justify-between gap-4 border-b border-black/[.06] px-5 py-3.5 last:border-0">
                    <span className="text-[17px] font-semibold tracking-[-0.01em]">{name}</span>
                    <span className="text-[14px] text-[#86868b]">{kind}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="px-5 text-[12px] text-[#86868b]">
            Marcas de sus respectivos dueños. Describen experiencia de implementación, no alianzas.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="hablemos" className="tile on-night bg-night px-4 pb-16 pt-16 text-snow sm:pb-[88px] sm:pt-24">
      <img
        src="/images/brand/ninja-isotipo-flame.webp"
        alt=""
        width={240}
        height={311}
        className="mx-auto mb-7 block h-auto w-[120px] drop-shadow-[0_20px_40px_rgba(255,106,26,.25)]"
      />
      <img src="/images/brand/ninjasoft-logo-dark.webp" alt="Ninja Soft" width={640} height={145} className="mx-auto mb-6 h-10 w-auto" />
      <h2 className="text-[clamp(40px,6vw,72px)] font-bold">Hablemos de tu negocio.</h2>
      <p className="tile-sub text-mist">Escribinos por el chat o dejanos tu consulta. Te respondemos en horario comercial.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-7">
        <OpenChatButton className="btn-flame">Abrir el chat</OpenChatButton>
        <a href={POS_APP_URL} className="link-more">
          Probar NinjaPOS gratis
        </a>
      </div>
    </section>
  );
}

const FOOTER_COLS: { title: string; links: { href: string; label: string; ext?: boolean }[] }[] = [
  {
    title: "Productos",
    links: [
      { href: "#pos", label: "NinjaPOS" },
      { href: "#food", label: "Ninja Food" },
      { href: "#servicios", label: "Desarrollo a medida" },
      { href: POS_APP_URL, label: "Ingresar a NinjaPOS", ext: true },
      { href: FOOD_APP_URL, label: "Ingresar a Ninja Food", ext: true },
    ],
  },
  {
    title: "NinjaPOS",
    links: [
      { href: "#rubros", label: "Rubros" },
      { href: "#medios", label: "Medios de pago" },
      { href: "#funciones", label: "Funciones" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "#nosotros", label: "Nosotros" },
      { href: "#experiencia", label: "Experiencia" },
      { href: "#hablemos", label: "Contacto" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-night text-snow">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[min(900px,120vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,106,26,.18),transparent)]"
      />
      <div className="relative mx-auto max-w-[1100px] px-5 pt-16 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src="/images/brand/ninja-isotipo-flame.webp" alt="" width={240} height={311} className="h-11 w-auto" />
              <img src="/images/brand/ninjasoft-logo-dark.webp" alt="Ninja Soft" width={640} height={145} className="h-8 w-auto" />
            </div>
            <p className="mt-5 max-w-[34ch] text-[15px] leading-snug text-mist">
              Software seguro para negocios inteligentes. Hecho en Rosario para toda Latinoamérica.
            </p>
            <div className="mt-6 flex gap-3">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram de Ninja Soft" className="foot-social">
                <InstagramLogo size={22} />
              </a>
              <OpenChatButton label="Chatear con Ninja Soft" className="foot-social">
                <ChatCircleDots size={22} />
              </OpenChatButton>
            </div>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="group mt-7 flex items-start gap-3 text-[15px]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-white/[.07] text-[#ff8a1f]">
                <MapPin size={20} weight="fill" />
              </span>
              <span>
                <b className="block font-semibold group-hover:underline">{ADDRESS.street}</b>
                <span className="text-mist">{ADDRESS.city}</span>
              </span>
            </a>
          </div>

          <nav aria-label="Pie" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_COLS.map((c) => (
              <div key={c.title}>
                <p className="text-[13px] font-semibold uppercase tracking-[.12em] text-mist">{c.title}</p>
                <ul className="mt-4 grid gap-3 text-[15px]">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} className="inline-flex items-center gap-1 text-snow/85 transition-colors hover:text-white">
                        {l.label}
                        {l.ext && <ArrowUpRight size={13} className="opacity-60" />}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <p aria-hidden className="foot-word mt-16 select-none text-center font-display font-bold leading-[.8] tracking-[-0.05em]">
          Ninja Soft
        </p>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/10 py-6 text-center text-[13px] text-mist sm:flex-row">
          <span>
            © <Year initial={new Date().getFullYear()} /> Ninja Soft. Todos los derechos reservados.
          </span>
          <span>
            {ADDRESS.street} · {ADDRESS.city}
          </span>
        </div>
      </div>
    </footer>
  );
}
