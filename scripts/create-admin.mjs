/**
 * Crea un usuario admin en Supabase Auth (API admin).
 *
 * Requisitos en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Settings → API → service_role, secreto)
 *
 * Uso: npm run create-admin
 *
 * Opcional:
 *   ADMIN_EMAIL=otro@mail.com ADMIN_PASSWORD=TuClaveSegura1! npm run create-admin
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email =
  process.env.ADMIN_EMAIL || "admin@complejofrentealmar.local";
const password =
  process.env.ADMIN_PASSWORD || "ComplejoMar2026!Admin";

if (!url || !serviceKey) {
  console.error(
    "\n❌ Faltan variables en .env.local:\n" +
      "   NEXT_PUBLIC_SUPABASE_URL\n" +
      "   SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API)\n"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  if (
    error.message?.includes("already been registered") ||
    error.message?.includes("already registered")
  ) {
    console.log("\nℹ️  Ese email ya existe en Supabase Auth.\n");
    console.log("   Email:", email);
    console.log(
      "   Si no recordás la contraseña: Dashboard → Authentication → Users → Reset password\n"
    );
    process.exit(0);
  }
  console.error("\n❌", error.message);
  process.exit(1);
}

console.log("\n✅ Usuario admin creado en Supabase.\n");
console.log("   Email:       ", email);
console.log("   Contraseña:  ", password);
console.log(
  "\n   Entrá en: http://localhost:3000/admin/login (o tu URL de deploy)\n" +
    "   Cambiá la contraseña en producción.\n"
);
