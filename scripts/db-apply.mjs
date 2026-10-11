// Uso: node scripts/db-apply.mjs supabase/migrations/<archivo>.sql
import { readFileSync } from "node:fs";
import { sql, REF } from "./sb.mjs";

const file = process.argv[2];
if (!file) throw new Error("Pasá la ruta del .sql");
await sql(readFileSync(file, "utf8"));
console.log(`OK ${file} → ${REF}`);
