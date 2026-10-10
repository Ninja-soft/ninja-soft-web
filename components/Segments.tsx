import { SEGMENTS } from "@/lib/content";

export function Segments() {
  return (
    <section id="rubros" className="tile on-night rise bg-night pb-14 text-snow">
      <h2 className="tile-title">Un POS para cada negocio.</h2>
      <p className="tile-sub text-mist">Elegís tu rubro y el sistema se configura solo.</p>
      <div className="mx-auto mt-10 grid max-w-[1000px] grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
        {SEGMENTS.map((s) => (
          <article key={s.title} className="rounded-[22px] border border-white/10 bg-white/5 p-[22px]">
            <h3 className="text-xl font-extrabold">{s.title}</h3>
            <ul className="mt-3.5 grid gap-2.5">
              {s.items.map((item) => (
                <li
                  key={item}
                  className="relative pl-[18px] text-[15px] leading-snug text-mist before:absolute before:left-0 before:top-[.5em] before:h-[7px] before:w-[7px] before:rounded-full before:bg-flame before:content-['']"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
