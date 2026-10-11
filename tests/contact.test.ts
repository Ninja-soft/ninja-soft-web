import { beforeEach, describe, expect, test } from "vitest";
import { ACK_GLOBAL_PER_HOUR, CONTACT_LIMIT, handleContact } from "../supabase/functions/_shared/contact.ts";
import { FakeStore, fakeMailer, fakeTelegram } from "./fakes.ts";

const CFG = { telegram_group_id: "-100", sender: "Ninja <a@b.co>", notify_email: "lucas@x.com", site_url: "https://s", forms_thread_id: "" };
const body = { name: "Ana", email: "Ana@Mail.com", phone: "", business: "Kiosco", message: "Quiero una demo <ya>" };
let store: FakeStore;

beforeEach(() => {
  store = new FakeStore({ ...CFG }, { resend_api_key: "re_1", telegram_bot_token: "1:a" });
});

describe("handleContact", () => {
  test("válido: guarda, avisa a Lucas, responde al cliente y avisa en Telegram", async () => {
    const m = fakeMailer();
    const tg = fakeTelegram();
    const r = await handleContact({ store, mailer: m.factory, telegram: tg.factory }, { ip: "h", body });
    expect(r).toEqual({ status: 200, json: { ok: true } });
    expect(store.contacts[0]).toMatchObject({ name: "Ana", email: "ana@mail.com", ip_hash: "h" });
    expect(m.sent.map((x) => [x.to, x.replyTo])).toEqual([
      ["lucas@x.com", "ana@mail.com"],
      ["ana@mail.com", "lucas@x.com"],
    ]);
    expect(m.sent[0].html).toContain("&lt;ya&gt;");
    expect(tg.calls.topics).toEqual(["📥 Formularios"]);
    expect(store.cfg.forms_thread_id).toBe("101");
    expect(tg.calls.sent[0].text).toContain("Quiero una demo <ya>");
  });

  test("varios emails de aviso: cada uno recibe el suyo; la auto-respuesta contesta al primero", async () => {
    store.cfg.notify_email = "lucas@x.com, socio@x.com";
    const m = fakeMailer();
    await handleContact({ store, mailer: m.factory, telegram: fakeTelegram().factory }, { ip: "h", body });
    expect(m.sent.map((x) => [x.to, x.replyTo])).toEqual([
      ["lucas@x.com", "ana@mail.com"],
      ["socio@x.com", "ana@mail.com"],
      ["ana@mail.com", "lucas@x.com"],
    ]);
  });

  test("pide reunión por Teams: queda guardado, en el aviso de Telegram y en la variable {{reunion}}", async () => {
    store.templates = { ...store.templates, contact_notify: { subject: "x", html: "<p>{{reunion}}</p>" } };
    const m = fakeMailer();
    const tg = fakeTelegram();
    await handleContact(
      { store, mailer: m.factory, telegram: tg.factory },
      { ip: "h", body: { ...body, meeting: "on", meeting_pref: "martes 15 h" } },
    );
    expect(store.contacts[0]).toMatchObject({ meeting: true, meeting_pref: "martes 15 h" });
    expect(tg.calls.sent[0].text).toContain("📅 Quiere una reunión por Teams (martes 15 h)");
    expect(m.sent[0].html).toBe("<p>Sí, por Microsoft Teams · martes 15 h</p>");
  });

  test("empresa: en Telegram, guardada y como {{empresa}}", async () => {
    store.templates = { ...store.templates, contact_notify: { subject: "x", html: "<p>{{empresa}}</p>" } };
    const m = fakeMailer();
    const tg = fakeTelegram();
    await handleContact({ store, mailer: m.factory, telegram: tg.factory }, { ip: "h", body: { ...body, company: "Don Pepe SRL" } });
    expect(store.contacts[0]).toMatchObject({ company: "Don Pepe SRL" });
    expect(tg.calls.sent[0].text).toContain("Empresa: Don Pepe SRL");
    expect(m.sent[0].html).toBe("<p>Don Pepe SRL</p>");
  });

  test("reutiliza el tema de Formularios", async () => {
    store.cfg.forms_thread_id = "77";
    const tg = fakeTelegram();
    await handleContact({ store, mailer: fakeMailer().factory, telegram: tg.factory }, { ip: "h", body });
    expect(tg.calls.topics).toHaveLength(0);
    expect(tg.calls.sent[0].threadId).toBe(77);
  });

  test("dominio sin verificar: falla el mail al cliente pero se guarda y Lucas recibe el suyo", async () => {
    const m = fakeMailer({ failTo: "ana@mail.com" });
    const r = await handleContact({ store, mailer: m.factory, telegram: fakeTelegram().factory }, { ip: "h", body });
    expect(r.status).toBe(200);
    expect(store.contacts).toHaveLength(1);
    expect(m.sent.map((x) => x.to)).toEqual(["lucas@x.com"]);
  });

  test("inválido → 400; honeypot → 200 sin guardar", async () => {
    const deps = { store, mailer: fakeMailer().factory, telegram: fakeTelegram().factory };
    expect((await handleContact(deps, { ip: "h", body: { ...body, email: "x" } })).status).toBe(400);
    expect((await handleContact(deps, { ip: "h", body: { ...body, website: "spam" } })).status).toBe(200);
    expect(store.contacts).toHaveLength(0);
  });

  test("límite por IP → 429", async () => {
    const deps = { store, mailer: fakeMailer().factory, telegram: fakeTelegram().factory };
    for (let i = 0; i < CONTACT_LIMIT.perIp; i++) await handleContact(deps, { ip: "h", body });
    expect((await handleContact(deps, { ip: "h", body })).status).toBe(429);
  });

  test("tema Formularios borrado → se recrea y el aviso llega", async () => {
    store.cfg.forms_thread_id = "77";
    const tg = fakeTelegram({ failSendOnce: true });
    await handleContact({ store, mailer: fakeMailer().factory, telegram: tg.factory }, { ip: "h", body });
    expect(tg.calls.topics).toEqual(["📥 Formularios"]);
    expect(tg.calls.sent[0].threadId).toBe(101);
    expect(store.cfg.forms_thread_id).toBe("101");
  });

  test("tope global de auto-respuestas por hora: se guarda y avisa a Lucas, pero no se responde al cliente", async () => {
    for (let i = 0; i < ACK_GLOBAL_PER_HOUR; i++) await store.hit("contact:ack:global");
    const m = fakeMailer();
    const r = await handleContact({ store, mailer: m.factory, telegram: fakeTelegram().factory }, { ip: "otra", body });
    expect(r.status).toBe(200);
    expect(store.contacts).toHaveLength(1);
    expect(m.sent.map((x) => x.to)).toEqual(["lucas@x.com"]);
  });
});

