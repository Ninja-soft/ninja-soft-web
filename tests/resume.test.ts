import { beforeEach, describe, expect, test } from "vitest";
import { handleResumeRequest, handleResumeVerify, PIN_MAX_ATTEMPTS } from "../supabase/functions/_shared/resume.ts";
import { FakeStore, fakeMailer } from "./fakes.ts";

const CFG = { sender: "Ninja <a@b.co>", site_url: "https://s" };
let store: FakeStore;

beforeEach(async () => {
  store = new FakeStore({ ...CFG }, { resend_api_key: "re_1" });
  await store.createSession("viejo", "Ana", "ana@mail.com");
});

describe("pedir código", () => {
  test("email con chat abierto → manda un PIN de 6 dígitos y lo guarda hasheado", async () => {
    const m = fakeMailer();
    const r = await handleResumeRequest({ store, mailer: m.factory, pin: () => "123456" }, { ip: "h", body: { email: " Ana@Mail.com " } });
    expect(r).toEqual({ status: 200, json: { ok: true } });
    expect(m.sent[0].to).toBe("ana@mail.com");
    expect(m.sent[0].html).toContain("123456");
    expect(store.pins.get("s1")?.hash).not.toContain("123456");
  });

  test("email sin chat → misma respuesta, sin mail (no revela si existe)", async () => {
    const m = fakeMailer();
    const r = await handleResumeRequest({ store, mailer: m.factory, pin: () => "123456" }, { ip: "h", body: { email: "otro@mail.com" } });
    expect(r).toEqual({ status: 200, json: { ok: true } });
    expect(m.sent).toHaveLength(0);
  });

  test("email inválido → 400; más de 3 pedidos por hora → 429", async () => {
    const deps = { store, mailer: fakeMailer().factory, pin: () => "111111" };
    expect((await handleResumeRequest(deps, { ip: "h", body: { email: "x" } })).status).toBe(400);
    for (let i = 0; i < 3; i++) await handleResumeRequest(deps, { ip: "h", body: { email: "ana@mail.com" } });
    expect((await handleResumeRequest(deps, { ip: "h", body: { email: "ana@mail.com" } })).status).toBe(429);
  });
});

describe("validar código", () => {
  const ask = () => handleResumeRequest({ store, mailer: fakeMailer().factory, pin: () => "123456" }, { ip: "h", body: { email: "ana@mail.com" } });

  test("PIN correcto → la conversación pasa a este navegador y el PIN se borra", async () => {
    await ask();
    const r = await handleResumeVerify({ store }, { userId: "nuevo", body: { email: "ana@mail.com", pin: "123456" } });
    expect(r).toEqual({ status: 200, json: { ok: true, sessionId: "s1" } });
    expect(store.sessions[0].user_id).toBe("nuevo");
    expect(store.pins.has("s1")).toBe(false);
  });

  test("PIN incorrecto → 400 y suma intento; al llegar al máximo se invalida", async () => {
    await ask();
    for (let i = 0; i < PIN_MAX_ATTEMPTS; i++) {
      const r = await handleResumeVerify({ store }, { userId: "nuevo", body: { email: "ana@mail.com", pin: "000000" } });
      expect(r.status).toBe(400);
    }
    const r = await handleResumeVerify({ store }, { userId: "nuevo", body: { email: "ana@mail.com", pin: "123456" } });
    expect(r.status).toBe(400);
    expect(store.sessions[0].user_id).toBe("viejo");
  });

  test("PIN vencido → 400", async () => {
    await ask();
    store.pins.get("s1")!.expires_at = new Date(Date.now() - 1000).toISOString();
    const r = await handleResumeVerify({ store }, { userId: "nuevo", body: { email: "ana@mail.com", pin: "123456" } });
    expect(r.status).toBe(400);
    expect(store.sessions[0].user_id).toBe("viejo");
  });
});
