"use client";

import { CircleDashed, type Icon } from "@phosphor-icons/react";

// Piezas comunes del panel interno (misma estética que el interno de NinjaPOS).

export function PageHeader({ eyebrow, title, desc, actions }: { eyebrow: string; title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="ix-eyebrow">{eyebrow}</span>
        <h1 className="mt-3 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] md:text-[36px]">{title}</h1>
        {desc && <p className="ix-muted mt-2 max-w-[60ch] text-[15px]">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return <span role="status" aria-label="Cargando" className="ix-spinner" style={{ width: size, height: size }} />;
}

export function SpinnerBlock() {
  return (
    <div className="flex items-center justify-center py-14">
      <Spinner size={26} />
    </div>
  );
}

export function Empty({ icon: I, title, desc }: { icon: Icon; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-white/[.05] text-[#a99fd0]">
        <I size={22} />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      {desc && <p className="ix-muted mt-1 max-w-[42ch] text-[14px]">{desc}</p>}
    </div>
  );
}

// Sin datos: nunca un guión, siempre un ícono.
export function NoData({ size = 16, label = "Sin datos" }: { size?: number; label?: string }) {
  return (
    <span className="ix-muted inline-flex items-center gap-1.5 opacity-80">
      <CircleDashed size={size} aria-hidden />
      <span className="text-[13px] font-semibold">{label}</span>
    </span>
  );
}

export function Kpi({ icon: I, label, value, sub, tone }: { icon: Icon; label: string; value: React.ReactNode | null | undefined; sub?: string; tone?: string }) {
  return (
    <div className="ix-card p-4">
      <div className="ix-muted flex items-center gap-1.5">
        <I size={16} />
        <span className="text-[12px]">{label}</span>
      </div>
      {value === undefined ? (
        <p className="mt-2.5">
          <Spinner size={18} />
        </p>
      ) : value === null ? (
        <p className="mt-2">
          <NoData size={18} />
        </p>
      ) : (
        <p className="mt-1 text-[26px] font-black tracking-[-0.02em]" style={tone ? { color: tone } : undefined}>
          {value}
        </p>
      )}
      {sub && <p className="ix-muted mt-0.5 text-[12px]">{sub}</p>}
    </div>
  );
}

const AVATAR_COLORS = ["#ff6a2c", "#ec3f17", "#ffb020", "#7c4dff", "#2db8a3", "#3b82f6", "#e8456b", "#16a34a", "#0ea5e9", "#a855f7"];

export function initials(name: string): string {
  const words = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  if (!words.length) return "?";
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)).toUpperCase();
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: AVATAR_COLORS[h % AVATAR_COLORS.length] }}
    >
      {initials(name)}
    </span>
  );
}

export function Note({ note }: { note: { ok: boolean; text: string } | null }) {
  if (!note) return null;
  return (
    <p
      role="status"
      className={`ix-fade rounded-lg border px-4 py-3 text-[14px] ${
        note.ok ? "border-emerald-400/20 bg-emerald-400/[.06] text-[#6ee7b7]" : "border-red-400/20 bg-red-400/[.06] text-[#fca5a5]"
      }`}
    >
      {note.text}
    </p>
  );
}

export const timeAgo = (iso: string) => {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return "ahora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d`;
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
};
