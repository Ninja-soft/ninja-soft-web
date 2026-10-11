export const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// IP real: headers que pone el proxy de la plataforma; si sólo hay x-forwarded-for, el último salto
// (el primero lo puede inventar el cliente y saltearse los límites).
export function clientIp(req: Request): string {
  const h = req.headers;
  const direct = h.get("cf-connecting-ip") ?? h.get("x-real-ip");
  if (direct?.trim()) return direct.trim();
  const hops = (h.get("x-forwarded-for") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return hops[hops.length - 1] ?? "desconocida";
}

export const bearer = (req: Request) => (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");

export async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
