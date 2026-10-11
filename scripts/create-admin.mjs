// Uso (PowerShell): $env:ADMIN_PASSWORD='...'; node scripts/create-admin.mjs lucas@mail.com
// Crea (o actualiza la contraseña de) un usuario y lo agrega a internal_admins.
import { createClient } from "@supabase/supabase-js";
import { lit, SB_URL, serviceKey, sql } from "./sb.mjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
if (!email.includes("@")) throw new Error("Pasá el email del admin");
if (password.length < 8) throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres");

const admin = createClient(SB_URL, await serviceKey(), { auth: { persistSession: false } }).auth.admin;
const [existing] = await sql(`select id from auth.users where lower(email) = ${lit(email)}`);
let id = existing?.id;
if (id) {
  const { error } = await admin.updateUserById(id, { password });
  if (error) throw error;
} else {
  const { data, error } = await admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  id = data.user.id;
}
await sql(`insert into internal_admins (user_id) values (${lit(id)}) on conflict do nothing`);
console.log(`OK admin ${email}`);
