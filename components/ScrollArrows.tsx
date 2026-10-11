"use client";

import { useEffect, useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";

// Flechas flotantes (abajo a la izquierda): ir al inicio / ir al final de la página.
// Cada una aparece sólo cuando tiene sentido.
export function ScrollArrows() {
  const [state, setState] = useState({ up: false, down: false });

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const end = document.documentElement.scrollHeight - window.innerHeight;
      setState({ up: y > 600, down: y > 200 && y < end - 600 });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const go = (top: number) => window.scrollTo({ top, behavior: "smooth" });

  return (
    <div className="scroll-arrows">
      <button
        type="button"
        aria-label="Ir arriba"
        onClick={() => go(0)}
        className={`scroll-arrow ${state.up ? "" : "is-hidden"}`}
        tabIndex={state.up ? 0 : -1}
      >
        <CaretUp size={20} weight="bold" />
      </button>
      <button
        type="button"
        aria-label="Ir abajo"
        onClick={() => go(document.documentElement.scrollHeight)}
        className={`scroll-arrow ${state.down ? "" : "is-hidden"}`}
        tabIndex={state.down ? 0 : -1}
      >
        <CaretDown size={20} weight="bold" />
      </button>
    </div>
  );
}
