"use client";

import { useEffect, useRef, useState } from "react";

// Isotipo del hero. Si existe /videos/hero.mp4 (video hecho con Gemini) se
// reproduce en loop; si no, o si la persona pidió reducir movimiento, queda la
// imagen fija con un giro leve al scrollear.
const VIDEO_SRC = "/videos/hero.mp4";

export function HeroArt() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [video, setVideo] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let alive = true;
    fetch(VIDEO_SRC, { method: "HEAD" })
      .then((r) => alive && r.ok && setVideo(true))
      .catch(() => {});

    let raf = 0;
    const update = () => {
      raf = 0;
      const img = imgRef.current;
      if (!img) return;
      const p = Math.min(1, Math.max(0, window.scrollY / 700));
      img.style.transform = `perspective(900px) rotateY(${p * -18}deg) rotateZ(${p * 6}deg) scale(${1 + p * 0.12}) translateY(${p * -20}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      alive = false;
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (video) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl">
        <video
          src={VIDEO_SRC}
          poster="/images/brand/ninja-isotipo-black.webp"
          autoPlay
          muted
          loop
          playsInline
          aria-label="Isotipo de Ninja Soft en movimiento"
          className="h-auto w-full"
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto mt-8 w-[min(380px,46vw)] pb-6 sm:mt-12 sm:w-[min(380px,72vw)] sm:pb-10 after:absolute after:inset-x-[12%] after:bottom-[18px] after:h-7 after:rounded-[50%] after:bg-[radial-gradient(closest-side,rgba(17,12,34,.18),transparent)] after:content-['']">
      <img
        ref={imgRef}
        src="/images/brand/ninja-isotipo-black.webp"
        alt="Isotipo de Ninja Soft: una cinta en forma de S que forma una máscara ninja"
        width={720}
        height={865}
        className="block h-auto w-full origin-[50%_60%] drop-shadow-[0_40px_50px_rgba(17,12,34,.22)] will-change-transform"
      />
    </div>
  );
}
