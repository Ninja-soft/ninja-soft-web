import { describe, expect, test } from "vitest";
import { classifySource, deviceType, validateEvent } from "../supabase/functions/_shared/analytics.ts";

const SITE = "soft.ninja";

describe("classifySource", () => {
  test("utm manda sobre el referrer (sin importar mayúsculas)", () => {
    expect(classifySource("https://www.google.com/", { source: "IG", medium: "Story", campaign: "Promo Octubre" }, SITE)).toEqual({
      source: "Instagram",
      medium: "story",
      campaign: "promo octubre",
    });
  });
  test("sin referrer o desde el mismo sitio → Directo", () => {
    expect(classifySource("", {}, SITE).source).toBe("Directo");
    expect(classifySource("https://soft.ninja/#medios", {}, SITE).source).toBe("Directo");
    expect(classifySource("no-es-una-url", {}, SITE).source).toBe("Directo");
  });
  test("buscadores y redes conocidas", () => {
    expect(classifySource("https://www.google.com.ar/", {}, SITE)).toMatchObject({ source: "Google", medium: "orgánico" });
    expect(classifySource("https://l.instagram.com/?u=x", {}, SITE)).toMatchObject({ source: "Instagram", medium: "social" });
    expect(classifySource("https://m.facebook.com/", {}, SITE)).toMatchObject({ source: "Facebook", medium: "social" });
    expect(classifySource("https://t.co/abc", {}, SITE)).toMatchObject({ source: "X", medium: "social" });
    expect(classifySource("https://web.whatsapp.com/", {}, SITE)).toMatchObject({ source: "WhatsApp", medium: "social" });
  });
  test("otros sitios → referido con su dominio", () => {
    expect(classifySource("https://www.blogdekioscos.com.ar/nota", {}, SITE)).toEqual({ source: "blogdekioscos.com.ar", medium: "referido", campaign: "" });
  });
});

test("deviceType por ancho de pantalla", () => {
  expect(deviceType(390)).toBe("Celular");
  expect(deviceType(820)).toBe("Tablet");
  expect(deviceType(1440)).toBe("Computadora");
  expect(deviceType(Number.NaN)).toBe("Computadora");
});

describe("validateEvent", () => {
  test("acepta un evento válido y normaliza", () => {
    expect(validateEvent({ type: "section", path: "/", section: "medios", value: 50, sid: "abc", w: 390 })).toMatchObject({
      type: "section",
      path: "/",
      section: "medios",
      value: 50,
      sid: "abc",
      device: "Celular",
    });
  });
  test("descarta basura", () => {
    expect(validateEvent(null)).toBeNull();
    expect(validateEvent({ type: "hackeo", path: "/" })).toBeNull();
    expect(validateEvent({ type: "view", path: "https://evil" })).toBeNull();
    expect(validateEvent({ type: "section", path: "/", section: "<script>" })?.section).toBe("");
    expect(validateEvent({ type: "scroll", path: "/", value: 9999 })?.value).toBe(100);
  });
});
