"use client";

import { useEffect, useRef, useState } from "react";
import { Handshake, MagnifyingGlass, PencilRuler, Rocket, type Icon } from "@phosphor-icons/react";
import { PROCESS } from "@/lib/content";

// "Así trabajamos": línea de tiempo que se completa al entrar en pantalla.
// Horizontal en desktop, vertical en celular. Sólo transform/opacity.
const STEPS: { Icon: Icon; deliverable: string }[] = [
  { Icon: MagnifyingGlass, deliverable: "Relevamiento" },
  { Icon: PencilRuler, deliverable: "Propuesta a medida" },
  { Icon: Rocket, deliverable: "Puesta en marcha" },
  { Icon: Handshake, deliverable: "Soporte continuo" },
];

export function Process() {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setOn(true), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} aria-label="Cómo trabajamos" className={`proc px-4 pb-20 sm:pb-28 ${on ? "is-on" : ""}`}>
      <div className="text-center">
        <p className="text-[15px] font-semibold text-flame-link">Cómo trabajamos</p>
        <h2 className="mx-auto mt-2 max-w-[20ch] text-[clamp(30px,4vw,48px)] font-bold leading-[1.05] tracking-[-0.03em]">
          De la primera charla al sistema andando.
        </h2>
      </div>

      <ol className="relative mx-auto mt-14 grid max-w-[1100px] gap-9 lg:grid-cols-4 lg:gap-6">
        {/* riel + relleno */}
        <span aria-hidden className="proc-rail absolute bottom-10 left-[33px] top-10 w-[2px] lg:bottom-auto lg:left-[12.5%] lg:right-[12.5%] lg:top-[33px] lg:h-[2px] lg:w-auto">
          <i className="proc-fill" />
        </span>

        {PROCESS.map((step, i) => {
          const { Icon, deliverable } = STEPS[i];
          return (
            <li key={step.title} className="proc-step relative flex gap-5 lg:flex-col lg:items-center lg:text-center" style={{ "--d": `${250 + i * 380}ms` } as React.CSSProperties}>
              <span className="proc-node relative z-[1] grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full bg-paper">
                <span className="grid h-[54px] w-[54px] place-items-center rounded-full bg-[linear-gradient(135deg,#ff4b22,#ff8a1f)] text-white shadow-[0_10px_24px_rgba(255,75,34,.35)]">
                  <Icon size={26} weight="duotone" />
                </span>
              </span>
              <div className="min-w-0 pt-1 lg:pt-0">
                <p className="text-[13px] font-semibold text-[#6e6e73]">Paso {i + 1}</p>
                <p className="mt-0.5 text-[24px] font-bold tracking-[-0.02em]">{step.title}</p>
                <p className="mx-auto mt-2 max-w-[28ch] text-[15.5px] leading-snug text-ink-2 lg:mx-auto">{step.desc}</p>
                <span className="mt-4 inline-flex items-center rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,.06),0_6px_16px_rgba(0,0,0,.05)]">
                  {deliverable}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
