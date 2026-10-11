import { expect, test } from "vitest";
import { clientIp } from "../supabase/functions/_shared/http.ts";

const req = (h: Record<string, string>) => new Request("https://x", { headers: h });

test("IP: prioriza el header del proxy por sobre lo que manda el cliente", () => {
  expect(clientIp(req({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "6.6.6.6, 2.2.2.2" }))).toBe("1.1.1.1");
  expect(clientIp(req({ "x-real-ip": "3.3.3.3", "x-forwarded-for": "6.6.6.6, 2.2.2.2" }))).toBe("3.3.3.3");
});

test("IP: con sólo x-forwarded-for usa el último salto (lo agrega el proxy, no el cliente)", () => {
  expect(clientIp(req({ "x-forwarded-for": "6.6.6.6, 2.2.2.2" }))).toBe("2.2.2.2");
  expect(clientIp(req({}))).toBe("desconocida");
});
