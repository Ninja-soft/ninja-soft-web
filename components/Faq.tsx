import { FAQ } from "@/lib/content";

// Preguntas frecuentes (acordeón nativo, sin JS). El mismo contenido va como FAQPage en los datos estructurados.
export function Faq() {
  return (
    <section id="preguntas" aria-labelledby="faq-title" className="px-4 pb-20 pt-4 sm:pb-28">
      <div className="mx-auto max-w-[860px]">
        <p className="text-center text-[15px] font-semibold text-flame-link">Preguntas frecuentes</p>
        <h2 id="faq-title" className="mt-2 text-center text-[clamp(30px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.03em]">
          Todo sobre NinjaPOS.
        </h2>
        <div className="mt-10 overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_30px_rgba(0,0,0,.05)]">
          {FAQ.map((f) => (
            <details key={f.q} className="faq-item group border-b border-black/[.06] last:border-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left">
                <h3 className="text-[17px] font-semibold tracking-[-0.01em]">{f.q}</h3>
                <span aria-hidden className="faq-plus grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f2f7] text-[20px] leading-none text-ink-2">
                  +
                </span>
              </summary>
              <p className="px-6 pb-6 text-[16px] leading-relaxed text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
