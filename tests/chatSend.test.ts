import { beforeEach, describe, expect, test } from "vitest";
import { handleChatSend, LIMITS } from "../supabase/functions/_shared/chatSend.ts";
import { FakeStore, fakeTelegram } from "./fakes.ts";

const CFG = { telegram_group_id: "-100" };
const lead = { name: "Ana", contact: "ana@mail.com" };
let store: FakeStore;

beforeEach(() => {
  store = new FakeStore({ ...CFG }, { telegram_bot_token: "123:abc" });
});

describe("handleChatSend", () => {
  test("primer mensaje sin nombre/contacto → 400 y no guarda nada", async () => {
    const tg = fakeTelegram();
    const r = await handleChatSend({ store, telegram: tg.factory }, { userId: "u1", ip: "ip", body: { message: "hola" } });
    expect(r.status).toBe(400);
    expect(store.messages).toHaveLength(0);
  });

  test("primer mensaje: crea sesión, tema y lo reenvía", async () => {
    const tg = fakeTelegram();
    const r = await handleChatSend(
      { store, telegram: tg.factory },
      { userId: "u1", ip: "ip", body: { ...lead, message: "hola" } },
    );
    expect(r).toEqual({ status: 200, json: { ok: true, id: "m1", sessionId: "s1", delivered: true } });
    expect(tg.calls.topics).toEqual(["Ana · ana@mail.com"]);
    expect(tg.calls.sent).toEqual([{ threadId: 101, text: "hola" }]);
    expect(store.sessions[0].telegram_thread_id).toBe(101);
  });

  test("segundo mensaje reutiliza el tema", async () => {
    const tg = fakeTelegram();
    const deps = { store, telegram: tg.factory };
    await handleChatSend(deps, { userId: "u1", ip: "ip", body: { ...lead, message: "uno" } });
    await handleChatSend(deps, { userId: "u1", ip: "ip", body: { message: "dos" } });
    expect(tg.calls.topics).toHaveLength(1);
    expect(tg.calls.sent.map((s) => s.threadId)).toEqual([101, 101]);
  });

  test("Lucas borró el tema: lo recrea y el mensaje llega", async () => {
    const first = fakeTelegram();
    await handleChatSend({ store, telegram: first.factory }, { userId: "u1", ip: "ip", body: { ...lead, message: "uno" } });
    const tg = fakeTelegram({ failSendOnce: true });
    const r = await handleChatSend({ store, telegram: tg.factory }, { userId: "u1", ip: "ip", body: { message: "dos" } });
    expect(r.json.delivered).toBe(true);
    expect(tg.calls.topics).toEqual(["Ana · ana@mail.com"]);
    expect(tg.calls.sent).toEqual([{ threadId: 101, text: "dos" }]);
    expect(store.sessions[0].telegram_thread_id).toBe(101);
  });

  test("sin token de Telegram: guarda igual y avisa delivered:false", async () => {
    store.secrets = {};
    const tg = fakeTelegram();
    const r = await handleChatSend({ store, telegram: tg.factory }, { userId: "u1", ip: "ip", body: { ...lead, message: "hola" } });
    expect(r.status).toBe(200);
    expect(r.json.delivered).toBe(false);
    expect(store.messages).toHaveLength(1);
  });

  test("límite por sesión → 429", async () => {
    const tg = fakeTelegram();
    const deps = { store, telegram: tg.factory };
    await handleChatSend(deps, { userId: "u1", ip: "ip", body: { ...lead, message: "0" } });
    for (let i = 1; i < LIMITS.perSession; i++) await handleChatSend(deps, { userId: "u1", ip: "ip", body: { message: String(i) } });
    const r = await handleChatSend(deps, { userId: "u1", ip: "ip", body: { message: "uno más" } });
    expect(r.status).toBe(429);
    expect(store.messages).toHaveLength(LIMITS.perSession);
  });

  test("honeypot: responde ok pero no guarda ni reenvía", async () => {
    const tg = fakeTelegram();
    const r = await handleChatSend(
      { store, telegram: tg.factory },
      { userId: "u1", ip: "ip", body: { ...lead, message: "spam", website: "x" } },
    );
    expect(r.status).toBe(200);
    expect(store.messages).toHaveLength(0);
    expect(tg.calls.sent).toHaveLength(0);
  });
});
