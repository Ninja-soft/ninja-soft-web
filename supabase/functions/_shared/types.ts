// Tipos compartidos entre Edge Functions y tests.
export type Sender = "visitor" | "agent" | "system";

export type Session = {
  id: string;
  user_id: string;
  name: string;
  contact: string;
  telegram_thread_id: number | null;
  last_seen_at: string;
};

export type Settings = Record<string, string>;

export const TEMPLATE_KEYS = ["contact_ack", "contact_notify", "chat_reply"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export type Template = { subject: string; html: string };

export const SECRET_NAMES = ["telegram_bot_token", "resend_api_key", "telegram_webhook_secret"] as const;
export type SecretName = (typeof SECRET_NAMES)[number];
export const EDITABLE_SECRETS: readonly SecretName[] = ["telegram_bot_token", "resend_api_key"];

export type MessageInsert = {
  session_id: string;
  sender: Sender;
  body: string;
  telegram_message_id?: number | null;
};

export type ContactInput = {
  name: string;
  email: string;
  phone: string;
  business: string;
  message: string;
  meeting: boolean; // pidió reunión por Microsoft Teams
  meeting_pref: string; // día/horario preferido (opcional)
};
export type ContactRecord = ContactInput & { ip_hash: string };

export type HandlerResult = { status: number; json: Record<string, unknown> };

// Acceso a datos. En producción lo implementa supabaseStore.ts; en tests, FakeStore.
export interface Store {
  settings(): Promise<Settings>;
  secret(name: SecretName): Promise<string | null>;
  sessionForUser(userId: string): Promise<Session | null>;
  sessionByThread(threadId: number): Promise<Session | null>;
  createSession(userId: string, name: string, contact: string): Promise<Session>;
  setThread(sessionId: string, threadId: number): Promise<void>;
  addMessage(m: MessageInsert): Promise<{ id: string }>;
  markEmailed(messageId: string): Promise<void>;
  countRecent(bucket: string, windowMs: number): Promise<number>;
  hit(bucket: string): Promise<void>;
  template(key: TemplateKey): Promise<Template | null>;
  saveContact(c: ContactRecord): Promise<{ id: string }>;
  setSetting(key: string, value: string): Promise<void>;
}
