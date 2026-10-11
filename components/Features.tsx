import { FEATURES } from "@/lib/content";

export function Features() {
  return (
    <section id="funciones" className="tile rise bg-paper-2 pb-14">
      <h2 className="tile-title">Todo lo que tu negocio necesita.</h2>
      <p className="tile-sub text-ink-2">Desde la caja hasta la factura, en el mismo sistema.</p>
      <div className="mx-auto mt-9 grid max-w-[1000px] grid-cols-2 gap-x-4 gap-y-5 text-left sm:gap-x-6 sm:gap-y-7 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="min-w-0 border-t border-line pt-3">
            <b className="block text-base font-semibold">{f.title}</b>
            <span className="mt-1 block text-sm leading-snug text-ink-2">{f.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
