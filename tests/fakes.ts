import type { Mail, Mailer } from "../supabase/functions/_shared/resend.ts";
import type { TelegramApi } from "../supabase/functions/_shared/telegram.ts";
import type {
  ContactRecord,
  MessageInsert,
  SecretName,
  Session,
  Settings,
  Store,
  Template,
  TemplateKey,
} from "../supabase/functions/_shared/types.ts";

export const TEMPLATES: Record<TemplateKey, Template> = {
  contact_ack: { subject: "Gracias {{nombre}}", html: "<p>{{mensaje}}</p>" },
  contact_notify: { subject: "Nuevo: {{nombre}}", html: "<p>{{nombre}} {{email}} {{mensaje}}</p>" },
  chat_reply: { subject: "Te respondimos", html: "<p>{{respuesta}}</p>" },
};

export class FakeStore implements Store {
  sessions: Session[] = [];
  messages: (MessageInsert & { id: string })[] = [];
  contacts: ContactRecord[] = [];
  hits: { bucket: string; at: number }[] = [];
  emailed: string[] = [];

  constructor(
    public cfg: Settings = {},
    public secrets: Partial<Record<SecretName, string>> = {},
    public templates: Partial<Record<TemplateKey, Template>> = TEMPLATES,
  ) {}

  async settings() {
    return { ...this.cfg };
  }
  async secret(name: SecretName) {
    return this.secrets[name] ?? null;
  }
  async sessionForUser(userId: string) {
    return this.sessions.find((s) => s.user_id === userId) ?? null;
  }
  async sessionByThread(threadId: number) {
    return this.sessions.find((s) => s.telegram_thread_id === threadId) ?? null;
  }
  async createSession(user_id: string, name: string, contact: string) {
    const s: Session = {
      id: `s${this.sessions.length + 1}`,
      user_id,
      name,
      contact,
      telegram_thread_id: null,
      last_seen_at: new Date().toISOString(),
    };
    this.sessions.push(s);
    return s;
  }
  async setThread(sessionId: string, threadId: number) {
    const s = this.sessions.find((x) => x.id === sessionId);
    if (s) s.telegram_thread_id = threadId;
  }
  async addMessage(m: MessageInsert) {
    const row = { ...m, id: `m${this.messages.length + 1}` };
    this.messages.push(row);
    return { id: row.id };
  }
  async markEmailed(id: string) {
    this.emailed.push(id);
  }
  async countRecent(bucket: string, windowMs: number) {
    const since = Date.now() - windowMs;
    return this.hits.filter((h) => h.bucket === bucket && h.at >= since).length;
  }
  async hit(bucket: string) {
    this.hits.push({ bucket, at: Date.now() });
  }
  async template(key: TemplateKey) {
    return this.templates[key] ?? null;
  }
  async saveContact(c: ContactRecord) {
    this.contacts.push(c);
    return { id: `c${this.contacts.length}` };
  }
  async setSetting(key: string, value: string) {
    this.cfg[key] = value;
  }
}

export function fakeTelegram(opts: { failSendOnce?: boolean } = {}) {
  const calls = { topics: [] as string[], sent: [] as { threadId: number | null; text: string }[] };
  let fail = !!opts.failSendOnce;
  let next = 100;
  const api: TelegramApi = {
    async createTopic(name) {
      calls.topics.push(name);
      return ++next;
    },
    async send(threadId, text) {
      if (fail) {
        fail = false;
        throw new Error("Telegram sendMessage: Bad Request: message thread not found");
      }
      calls.sent.push({ threadId, text });
      return calls.sent.length;
    },
  };
  return { api, calls, factory: (_token: string, _group: string) => api };
}

export function fakeMailer(opts: { failTo?: string } = {}) {
  const sent: Mail[] = [];
  const factory = (_apiKey: string): Mailer => async (m) => {
    if (opts.failTo && m.to === opts.failTo) throw new Error("Resend 403: domain not verified");
    sent.push(m);
  };
  return { sent, factory };
}
