import { FOOD_APP_URL } from "@/lib/content";

// QR decorativo determinístico (21x21 con los tres "finders"), calculado en el build.
function qrCells(): boolean[] {
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const finder = (r: number, c: number, R: number, C: number) => {
    const y = r - R;
    const x = c - C;
    if (y < 0 || x < 0 || y > 6 || x > 6) return null;
    return y === 0 || y === 6 || x === 0 || x === 6 || (y > 1 && y < 5 && x > 1 && x < 5);
  };
  const cells: boolean[] = [];
  for (let r = 0; r < 21; r++)
    for (let c = 0; c < 21; c++) {
      const f = finder(r, c, 0, 0) ?? finder(r, c, 0, 14) ?? finder(r, c, 14, 0);
      cells.push(f === null ? rnd() > 0.52 : f);
    }
  return cells;
}

const FACTS = [
  ["Elaborado", "08/10/2026"],
  ["Vence", "08/11/2026"],
  ["Cadena de frío", "−18,4 °C · en rango"],
  ["Firmó", "Operario 07 · PIN"],
] as const;

export function FoodSection() {
  const cells = qrCells();
  return (
    <section id="food" className="tile rise bg-paper-2">
      <img loading="lazy" decoding="async" src="/images/brand/ninjafood-logo-light.webp" alt="Ninja Food" width={640} height={142} className="mx-auto mb-5 h-11 w-auto max-w-full" />
      <h2 className="tile-title">Cada lote, trazado.</h2>
      <p className="tile-sub text-ink-2">
        Trazabilidad y gestión bromatológica para la industria alimenticia, con respaldo técnico de ABR.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-8">
        <a href="#hablemos" className="inline-flex min-h-[44px] items-center text-[17px] text-food hover:underline">
          Pedir una demo&nbsp;›
        </a>
        <a href={FOOD_APP_URL} className="inline-flex min-h-[44px] items-center text-[17px] text-food hover:underline">
          Ingresar&nbsp;›
        </a>
      </div>

      <div
        aria-hidden
        className="mx-auto mt-11 grid max-w-[560px] grid-cols-1 gap-[22px] rounded-t-[26px] border border-b-0 border-line bg-paper px-[26px] pb-[30px] pt-[26px] text-left shadow-[0_-24px_60px_rgba(33,19,90,.08)] sm:grid-cols-[1fr_auto]"
      >
        <div>
          <p className="font-mono text-[13px] text-ink-2">LOTE L-2610-014</p>
          <h3 className="mt-2 text-2xl font-bold">Empanadas de carne · caja x12</h3>
          <div className="mt-4 grid gap-2.5">
            {FACTS.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-t border-line pt-2.5 text-sm text-ink-2">
                <span>{k}</span>
                <b className={`font-semibold tabular-nums ${k === "Cadena de frío" ? "text-food" : "text-ink"}`}>{v}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="-order-1 grid h-[116px] w-[116px] grid-cols-[repeat(21,1fr)] self-start rounded-[14px] border border-line bg-white p-2 sm:order-none">
          {cells.map((on, i) => (
            <i key={i} className={on ? "rounded-[1px] bg-ink" : ""} />
          ))}
        </div>
      </div>
    </section>
  );
}
