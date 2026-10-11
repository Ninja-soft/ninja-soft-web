export type Mail = { from: string; to: string; subject: string; html: string; replyTo?: string };
export type Mailer = (m: Mail) => Promise<void>;

export function resendMailer(apiKey: string, fetchFn: typeof fetch = fetch): Mailer {
  return async (m) => {
    const r = await fetchFn("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: m.from, to: [m.to], subject: m.subject, html: m.html, reply_to: m.replyTo }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  };
}
