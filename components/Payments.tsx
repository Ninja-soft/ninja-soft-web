import { NETWORKS, PROCESSORS } from "@/lib/content";

// Los logos van sobre blanco para respetar los colores de cada marca.
export function Payments() {
  return (
    <section id="medios" className="tile rise bg-paper-2 pb-14">
      <h2 className="tile-title">Cobrá con todo.</h2>
      <p className="tile-sub text-ink-2">
        Todos los medios de pago del país en el mismo POS, con cuotas y planes propios por cada uno.
      </p>
      <div className="mx-auto mt-10 grid max-w-[920px] grid-cols-2 gap-2.5 md:grid-cols-4">
        {PROCESSORS.map((p) => (
          <img
            key={p.alt}
            src={p.src}
            alt={p.alt}
            className="h-20 w-full rounded-[18px] border border-line bg-white object-contain p-[18px] md:h-24 md:px-[26px] md:py-[22px]"
          />
        ))}
      </div>
      <div aria-label="Tarjetas y redes de cobro" className="mx-auto mt-4 flex max-w-[920px] flex-wrap justify-center gap-2.5">
        {NETWORKS.map((n) => (
          <img key={n.alt} src={n.src} alt={n.alt} className="h-10 w-auto rounded-[10px] border border-line bg-white px-2.5 py-1.5" />
        ))}
      </div>
      <p className="mt-6 text-[15px] text-ink-2">
        Además: efectivo con cálculo de vuelto, transferencia, QR, Point, links de pago y DEBIN.
      </p>
    </section>
  );
}
