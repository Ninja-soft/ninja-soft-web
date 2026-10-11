// Helpers para el proyecto Supabase "Ninja Soft Web" vía Management API.
// Requiere SUPABASE_ACCESS_TOKEN en el ambiente.
export const REF = process.env.SB_REF ?? "tgaromemhaixgdsdlxiq";
export const SB_URL = `https://${REF}.supabase.co`;
const API = "https://api.supabase.com/v1";

function token() {
  const t = process.env.SUPABASE_ACCESS_TOKEN;
  if (!t) throw new Error("Falta SUPABASE_ACCESS_TOKEN");
  return t;
}

export async function sql(query) {
  const r = await fetch(`${API}/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`SQL ${r.status}: ${text}`);
  return JSON.parse(text);
}

export async function serviceKey() {
  const r = await fetch(`${API}/projects/${REF}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  const keys = await r.json();
  const k = keys.find((x) => x.name === "service_role") ?? keys.find((x) => x.type === "secret");
  if (!k?.api_key) throw new Error("No se encontró la service key");
  return k.api_key;
}

export const lit = (v) => `'${String(v).replaceAll("'", "''")}'`;
