import { NAV, POS_APP_URL, PROCESS, whatsappUrl } from "@/lib/content";

export function Experience() {
  return (
    <section id="experiencia" className="mx-auto max-w-[980px] px-4 pb-10 pt-[110px]">
      <p className="font-display text-[clamp(30px,4.6vw,52px)] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#B9B3CB] [text-wrap:balance]">
        <em className="not-italic text-ink">Años implementando</em> Presea, Napse, Softland, Cygnus y Posberry.{" "}
        <em className="not-italic text-ink">Integrando</em> Producteca, E3 Stores, Mercado Libre y Mercado Pago.{" "}
        <em className="not-italic text-ink">Todo eso está en lo que hacemos.</em>
      </p>
      <p className="mt-5 text-[15px] text-ink-2">
        Las marcas mencionadas pertenecen a sus dueños y describen experiencia de implementación, no alianzas.
      </p>
    </section>
  );
}

export function Process() {
  return (
    <section aria-label="Cómo trabajamos" className="mx-auto grid max-w-5xl grid-cols-1 gap-7 px-4 pb-[110px] pt-10 sm:grid-cols-2 lg:grid-cols-4">
      {PROCESS.map((step, i) => (
        <div key={step.title} className="min-w-0 border-t-2 border-ink pt-4">
          <p className="font-mono text-[13px] text-flame-link">{String(i + 1).padStart(2, "0")}</p>
          <h3 className="mt-2.5 text-2xl font-extrabold">{step.title}</h3>
          <p className="mt-1.5 text-[15px] text-ink-2">{step.desc}</p>
        </div>
      ))}
    </section>
  );
}

export function Contact() {
  return (
    <section id="hablemos" className="tile on-night bg-night px-4 pb-[88px] pt-24 text-snow">
      <img
        src="/brand/isotipo-white.webp"
        alt=""
        width={480}
        height={578}
        className="mx-auto mb-7 block h-auto w-[120px] drop-shadow-[0_20px_40px_rgba(255,106,26,.25)]"
      />
      <img src="/brand/ninjasoft-dark.webp" alt="Ninja Soft" width={640} height={178} className="mx-auto mb-6 h-10 w-auto" />
      <h2 className="text-[clamp(40px,6vw,72px)] font-black">Hablemos de tu negocio.</h2>
      <p className="tile-sub text-mist">Te respondemos por WhatsApp, en horario comercial.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-7">
        <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn-flame">
          Escribir por WhatsApp
        </a>
        <a href={POS_APP_URL} className="link-more">
          Probar NinjaPOS gratis
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-5xl flex-wrap justify-between gap-x-7 gap-y-3 border-t border-line px-4 pb-10 pt-7 text-xs text-ink-2">
      <span>© {new Date().getFullYear()} Ninja Soft · Software seguro para negocios inteligentes.</span>
      <nav aria-label="Pie" className="flex flex-wrap gap-5">
        {NAV.map((item) => (
          <a key={item.href} href={item.href} className="hover:underline">
            {item.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
