// Uso: node scripts/set-secret.mjs telegram_bot_token "%USERPROFILE%\.ninja-telegram-token"
// Lee el valor de un archivo (nunca de la línea de comandos) y lo guarda en app_secrets.
import { readFileSync } from "node:fs";
import { lit, sql } from "./sb.mjs";

const [name, file] = process.argv.slice(2);
if (!["telegram_bot_token", "resend_api_key"].includes(name) || !file) {
  throw new Error("Uso: node scripts/set-secret.mjs <telegram_bot_token|resend_api_key> <archivo>");
}
const value = readFileSync(file, "utf8").replace(/^\uFEFF/, "").trim();
if (!value) throw new Error("El archivo está vacío");
await sql(
  `insert into app_secrets (name, value) values (${lit(name)}, ${lit(value)})
   on conflict (name) do update set value = excluded.value, updated_at = now()`,
);
console.log(`OK ${name} = ••••${value.slice(-4)}`);
