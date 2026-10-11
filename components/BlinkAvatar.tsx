"use client";

import { useEffect, useState } from "react";

// Isotipo con los ojos animados. Arranca con una imagen fija liviana y cambia a la animada
// cuando la página terminó de cargar (no compite con lo importante de la primera carga).
let animatedReady = false;

export function BlinkAvatar({ className }: { className?: string }) {
  const [animated, setAnimated] = useState(animatedReady);

  useEffect(() => {
    if (animatedReady) return;
    const go = () => {
      animatedReady = true;
      setAnimated(true);
    };
    const idle = () => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(go, { timeout: 3000 });
      else setTimeout(go, 1200);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
    return () => window.removeEventListener("load", idle);
  }, []);

  return (
    <img
      src={animated ? "/images/brand/ninja-isotipo-blink.webp" : "/images/brand/ninja-isotipo-blink-static.webp"}
      alt=""
      width={88}
      height={88}
      className={className}
    />
  );
}
