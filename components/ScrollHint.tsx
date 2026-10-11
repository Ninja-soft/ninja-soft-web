"use client";

import { useEffect, useState } from "react";

// Indicador de scroll: cápsula de vidrio con un mouse (puntero fino) o un gesto
// de deslizar hacia arriba (táctil). Desaparece al primer scroll.
export function ScrollHint() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div aria-hidden className={`scroll-hint ${hidden ? "is-hidden" : ""}`}>
      <span className="scroll-hint-mouse">
        <i />
      </span>
      <span className="scroll-hint-swipe">
        <i />
      </span>
      <span className="scroll-hint-label" />
    </div>
  );
}
