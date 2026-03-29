/**
 * Crea un usuario admin en Supabase Auth (API admin).
 *
 * Requisitos (una de estas formas):
 *   - .env.local o .env en la raíz con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *   - O exportar esas dos variables en la terminal antes de npm run create-admin
 *
 * Uso: npm run create-admin
 *
 * Opcional: ADMIN_EMAIL, ADMIN_PASSWORD
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(name) {
  const p = resolve(process.cwd(), name);
  if (!existsSync(p)) return;
  let text = readFileSync(p, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (const line of text.split(/\r?\n/)) {
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

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email =
  process.env.ADMIN_EMAIL || "admin@complejofrentealmar.local";
const password =
  process.env.ADMIN_PASSWORD || "ComplejoMar2026!Admin";

if (!url || !serviceKey) {
  const miss = [];
  if (!url) miss.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) miss.push("SUPABASE_SERVICE_ROLE_KEY");
  console.error("\n❌ Faltan: " + miss.join(" y ") + "\n");
  console.error(
    "Solo definiste ADMIN_EMAIL / ADMIN_PASSWORD; hacen falta también la URL del proyecto y la clave service_role.\n"
  );
  console.error("Opción A — Creá o editá el archivo .env.local en la raíz del repo (junto a package.json):\n");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co");
  console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   (opcional para Next, pero recomendado)");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=eyJ...       (Project Settings → API → service_role, SECRETO)\n");
  console.error("Opción B — PowerShell, en la MISMA ventana antes de npm run create-admin:\n");
  console.error('  $env:NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."');
  console.error("  npm run create-admin\n");
  console.error("Las claves están en: https://supabase.com/dashboard → tu proyecto → Settings → API\n");
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
