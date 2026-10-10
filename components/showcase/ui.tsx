// Piezas compartidas por las escenas de la vitrina del hero.

/** Retardo de animación CSS (la línea de tiempo de cada escena vive en CSS). */
export const T = (ms: number) => ({ animationDelay: `${ms}ms` });

export const panel = "w-full rounded-[18px] border border-white/10 bg-white/[.045] p-4";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`sc-spinner inline-block h-4 w-4 rounded-full border-2 border-white/15 border-t-[#FF7A2E] ${className}`}
    />
  );
}
