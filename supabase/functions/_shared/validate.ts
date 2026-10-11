import type { ContactInput } from "./types.ts";

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export type Lead = { name: string; contact: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s\-().]{6,20}$/;

export function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

// Texto de una línea: recorta, colapsa espacios y limita largo.
const line = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export const isEmail = (v: string) => EMAIL.test(v);
// Lista de emails separados por coma, punto y coma o espacios (descarta los inválidos).
export const emailList = (v: string | undefined) =>
  (v ?? "")
    .split(/[,;\s]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(isEmail);

export const isPhone = (v: string) => PHONE.test(v) && v.replace(/\D/g, "").length >= 6;

export function validateLead(raw: unknown): Result<Lead> {
  const o = obj(raw);
  const name = line(o.name, 80);
  const c = line(o.contact, 120);
  if (name.length < 2) return { ok: false, error: "Ingresá tu nombre." };
  // El chat pide email: es por donde llega la respuesta si el visitante se va.
  const contact = c.toLowerCase();
  if (!isEmail(contact)) return { ok: false, error: "Ingresá un email válido." };
  return { ok: true, value: { name, contact } };
}

export function validateMessage(raw: unknown): Result<string> {
  if (typeof raw !== "string" || !raw.trim()) return { ok: false, error: "Escribí un mensaje." };
  const t = raw.trim();
  if (t.length > 2000) return { ok: false, error: "El mensaje es demasiado largo (máx. 2000 caracteres)." };
  return { ok: true, value: t };
}

export function validateContact(raw: unknown): Result<ContactInput> {
  const o = obj(raw);
  const name = line(o.name, 80);
  const email = line(o.email, 120).toLowerCase();
  const phone = line(o.phone, 30);
  const company = line(o.company, 80);
  const business = line(o.business, 60);
  const message = typeof o.message === "string" ? o.message.trim().slice(0, 4000) : "";
  if (name.length < 2) return { ok: false, error: "Ingresá tu nombre." };
  if (!isEmail(email)) return { ok: false, error: "Ingresá un email válido." };
  if (phone && !isPhone(phone)) return { ok: false, error: "El teléfono no parece válido." };
  if (message.length < 5) return { ok: false, error: "Contanos un poco más en el mensaje." };
  const meeting = o.meeting === true || o.meeting === "on" || o.meeting === "true";
  const meeting_pref = meeting ? line(o.meeting_pref, 120) : "";
  return { ok: true, value: { name, email, phone, company, business, message, meeting, meeting_pref } };
}

// Campo oculto "website": sólo lo completan los bots.
export const isHoneypotFilled = (raw: unknown) => {
  const w = obj(raw).website;
  return typeof w === "string" && w.trim() !== "";
};

export function maskSecret(v: string | null): string | null {
  if (!v) return null;
  return v.length < 8 ? "••••" : `••••${v.slice(-4)}`;
}
