import { SERVICES } from "@/lib/content";

export function ServicesAbout() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <section id="servicios" className="tile on-night rise bg-night pb-12 text-snow">
        <h2 className="text-[clamp(30px,3.6vw,42px)] font-extrabold leading-[1.05]">Integraciones que no se caen.</h2>
        <p className="tile-sub text-mist">
          Conectamos tu ecommerce, tu ERP y tus cobros. Desarrollamos lo que falta, a medida.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SERVICES.map((s) => (
            <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-5 flex justify-center">
          <a href="#hablemos" className="link-more">
            Contanos tu proyecto
          </a>
        </div>
      </section>
      <section id="nosotros" className="tile rise bg-paper-2 pb-12">
        <h2 className="text-[clamp(30px,3.6vw,42px)] font-extrabold leading-[1.05]">
          Implementamos los sistemas del país. Construimos el nuestro.
        </h2>
        <p className="tile-sub text-ink-2">Programadores y project managers con años en retail, ecommerce y logística.</p>
        <div className="mt-5 flex justify-center">
          <a href="#experiencia" className="link-more">
            Nuestra experiencia
          </a>
        </div>
      </section>
    </div>
  );
}
