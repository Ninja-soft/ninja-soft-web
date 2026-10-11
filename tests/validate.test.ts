import { describe, expect, test } from "vitest";
import {
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
  test("acepta teléfono argentino con espacios y guiones", () => {
    expect(validateLead({ name: "Juan", contact: "+54 9 341 555-1234" }).ok).toBe(true);
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
