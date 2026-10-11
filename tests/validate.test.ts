import { describe, expect, test } from "vitest";
import {
  emailList,
  safeRedirect,
  isHoneypotFilled,
  maskSecret,
  validateContact,
  validateLead,
  validateMessage,
} from "../supabase/functions/_shared/validate.ts";

describe("validateLead", () => {
  test("email: recorta y pasa a minúsculas", () => {
    expect(validateLead({ name: "  Ana  Pérez ", contact: " Ana@Mail.COM " })).toEqual({
      ok: true,
      value: { name: "Ana Pérez", contact: "ana@mail.com" },
    });
  });
  test("el chat pide email: un teléfono no alcanza", () => {
    expect(validateLead({ name: "Juan", contact: "+54 9 341 555-1234" })).toEqual({ ok: false, error: "Ingresá un email válido." });
  });
  test("rechaza contacto inválido y nombre corto", () => {
    expect(validateLead({ name: "Juan", contact: "abc" }).ok).toBe(false);
    expect(validateLead({ name: "J", contact: "a@b.co" }).ok).toBe(false);
  });
});

describe("validateMessage", () => {
  test("rechaza vacío, sólo espacios y > 2000", () => {
    expect(validateMessage("").ok).toBe(false);
    expect(validateMessage("   ").ok).toBe(false);
    expect(validateMessage("x".repeat(2001)).ok).toBe(false);
    expect(validateMessage(42).ok).toBe(false);
  });
  test("conserva saltos de línea y emojis", () => {
    expect(validateMessage(" hola\n🔥 ")).toEqual({ ok: true, value: "hola\n🔥" });
  });
});

describe("validateContact", () => {
  const base = { name: "Ana", email: "ana@mail.com", phone: "", business: "Kiosco", message: "Quiero una demo" };
  test("teléfono opcional", () => {
    expect(validateContact(base).ok).toBe(true);
  });
  test("teléfono presente pero inválido se rechaza", () => {
    expect(validateContact({ ...base, phone: "12" }).ok).toBe(false);
  });
  test("reunión por Teams: tilde + horario preferido opcional", () => {
    const r = validateContact({ ...base, meeting: "on", meeting_pref: "  martes   a la tarde " });
    expect(r.ok && r.value.meeting).toBe(true);
    expect(r.ok && r.value.meeting_pref).toBe("martes a la tarde");
    const n = validateContact(base);
    expect(n.ok && n.value.meeting).toBe(false);
    expect(n.ok && n.value.meeting_pref).toBe("");
  });

  test("empresa opcional, recortada", () => {
    const r = validateContact({ ...base, company: "  Kiosco   Don Pepe  " });
    expect(r.ok && r.value.company).toBe("Kiosco Don Pepe");
    const n = validateContact(base);
    expect(n.ok && n.value.company).toBe("");
  });

  test("email obligatorio y mensaje mínimo", () => {
    expect(validateContact({ ...base, email: "" }).ok).toBe(false);
    expect(validateContact({ ...base, message: "hey" }).ok).toBe(false);
  });
});

test("honeypot", () => {
  expect(isHoneypotFilled({ website: "http://spam" })).toBe(true);
  expect(isHoneypotFilled({ website: "" })).toBe(false);
  expect(isHoneypotFilled(null)).toBe(false);
});

test("maskSecret", () => {
  expect(maskSecret("123456789:AAHxyz9876")).toBe("••••9876");
  expect(maskSecret("short")).toBe("••••");
  expect(maskSecret(null)).toBeNull();
});

test("emailList: varios emails separados por coma, punto y coma o espacio", () => {
  expect(emailList(" a@x.com, B@Y.com ;c@z.com  nope ")).toEqual(["a@x.com", "b@y.com", "c@z.com"]);
  expect(emailList("")).toEqual([]);
});

test("safeRedirect: sólo vuelve a /internal de orígenes permitidos", () => {
  const allowed = ["https://soft.ninja", "http://localhost:3100"];
  expect(safeRedirect("http://localhost:3100/internal?setpw=1", allowed)).toBe("http://localhost:3100/internal?setpw=1");
  expect(safeRedirect("https://evil.com/internal?setpw=1", allowed)).toBe("https://soft.ninja/internal?setpw=1");
  expect(safeRedirect("https://soft.ninja.evil.com/internal", allowed)).toBe("https://soft.ninja/internal?setpw=1");
  expect(safeRedirect(undefined, allowed)).toBe("https://soft.ninja/internal?setpw=1");
});
