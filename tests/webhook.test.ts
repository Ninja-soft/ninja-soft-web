import { beforeEach, describe, expect, test } from "vitest";
import { handleTelegramUpdate } from "../supabase/functions/_shared/webhook.ts";
import { FakeStore, fakeMailer, fakeMedia, fakeTelegram } from "./fakes.ts";

const G = "-100";
const update = (threadId: number, text: string) => ({
  update_id: 1,
  message: { message_id: 7, chat: { id: -100 }, from: { id: 1, is_bot: false }, is_topic_message: true, message_thread_id: threadId, text },
});
const CFG = { telegram_group_id: G, away_minutes: "2", sender: "Ninja <a@b.co>", notify_email: "lucas@x.com", site_url: "https://s" };
let store: FakeStore;

beforeEach(async () => {
  store = new FakeStore({ ...CFG }, { resend_api_key: "re_1" });
  const s = await store.createSession("u1", "Ana", "ana@mail.com");
  await store.setThread(s.id, 55);
});

describe("handleTelegramUpdate", () => {
  test("respuesta en un tema conocido → mensaje del agente", async () => {
    const m = fakeMailer();
    const r = await handleTelegramUpdate({ store, mailer: m.factory, telegram: fakeTelegram().factory, media: fakeMedia().media }, update(55, "Hola Ana"));
    expect(r.handled).toBe(true);
    expect(store.messages).toEqual([{ id: "m1", session_id: "s1", sender: "agent", body: "Hola Ana", telegram_message_id: 7, media_path: null }]);
  });

  test("tema desconocido → se ignora", async () => {
    const r = await handleTelegramUpdate({ store, mailer: fakeMailer().factory, telegram: fakeTelegram().factory, media: fakeMedia().media }, update(999, "x"));
    expect(r.handled).toBe(false);
    expect(store.messages).toHaveLength(0);
  });

  test("visitante presente → no se manda email", async () => {
    const m = fakeMailer();
    const r = await handleTelegramUpdate({ store, mailer: m.factory, telegram: fakeTelegram().factory, media: fakeMedia().media }, update(55, "Hola"), Date.now());
    expect(r.emailed).toBe(false);
    expect(m.sent).toHaveLength(0);
  });

  test("visitante ausente con email → email escapado y marcado", async () => {
    const m = fakeMailer();
    const later = Date.now() + 5 * 60_000;
    const r = await handleTelegramUpdate({ store, mailer: m.factory, telegram: fakeTelegram().factory, media: fakeMedia().media }, update(55, "<script>&"), later);
    expect(r.emailed).toBe(true);
    expect(m.sent[0]).toMatchObject({ to: "ana@mail.com", from: "Ninja <a@b.co>", replyTo: "lucas@x.com" });
    expect(m.sent[0].html).toBe("<p>&lt;script&gt;&amp;</p>");
    expect(store.emailed).toEqual(["m1"]);
  });

  test("con varios emails de aviso, el reply-to es el primero", async () => {
    store.cfg.notify_email = "lucas@x.com, socio@x.com";
    const m = fakeMailer();
    await handleTelegramUpdate({ store, mailer: m.factory, telegram: fakeTelegram().factory, media: fakeMedia().media }, update(55, "Hola"), Date.now() + 10 * 60_000);
    expect(m.sent[0].replyTo).toBe("lucas@x.com");
  });

  test("visitante ausente que dejó teléfono → nunca se intenta email", async () => {
    store.sessions[0].contact = "+54 9 341 555 1234";
    const m = fakeMailer();
    const r = await handleTelegramUpdate({ store, mailer: m.factory, telegram: fakeTelegram().factory, media: fakeMedia().media }, update(55, "Hola"), Date.now() + 10 * 60_000);
    expect(r.emailed).toBe(false);
    expect(m.sent).toHaveLength(0);
  });

  test("falla de Resend no rompe: el mensaje queda guardado", async () => {
    const m = fakeMailer({ failTo: "ana@mail.com" });
    const r = await handleTelegramUpdate({ store, mailer: m.factory, telegram: fakeTelegram().factory, media: fakeMedia().media }, update(55, "Hola"), Date.now() + 10 * 60_000);
    expect(r).toEqual({ handled: true, emailed: false });
    expect(store.messages).toHaveLength(1);
  });

  test("foto desde Telegram: se guarda en storage y llega al chat", async () => {
    store.secrets.telegram_bot_token = "1:a";
    const md = fakeMedia();
    const upd = update(55, "");
    (upd.message as Record<string, unknown>).text = undefined;
    Object.assign(upd.message, { photo: [{ file_id: "F1" }], caption: "el menú" });
    const r = await handleTelegramUpdate({ store, mailer: fakeMailer().factory, telegram: fakeTelegram().factory, media: md.media }, upd);
    expect(r.handled).toBe(true);
    expect([...md.files.keys()]).toEqual(["s1/tg-7.jpg"]);
    expect(store.messages[0]).toMatchObject({ sender: "agent", body: "el menú", media_path: "s1/tg-7.jpg" });
  });
});
