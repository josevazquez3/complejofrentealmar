/**
 * Crea o actualiza un usuario admin en la tabla `users` (Prisma / bcrypt).
 *
 * Requisitos: DATABASE_URL en .env.local o .env
 * Uso: npm run create-admin
 *
 * Opcional: ADMIN_EMAIL, ADMIN_PASSWORD
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

const email = (process.env.ADMIN_EMAIL || "admin@complejofrentealmar.local").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "ComplejoMar2026!Admin";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("\n❌ Falta DATABASE_URL (Neon / PostgreSQL).\n");
  console.error("Definilo en .env.local junto a DIRECT_URL si usás Prisma Migrate.\n");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { password: hash, role: "ADMIN" },
    });
    console.log("\n✅ Usuario admin actualizado (contraseña renovada).\n");
  } else {
    await prisma.user.create({
      data: { email, password: hash, role: "ADMIN" },
    });
    console.log("\n✅ Usuario admin creado.\n");
  }
  console.log("   Email:       ", email);
  console.log("   Contraseña:  ", password);
  console.log("\n   Entrá en: http://localhost:3000/admin/login (o tu URL de deploy)");
  console.log("   Cambiá la contraseña en producción.\n");
} catch (e) {
  console.error("\n❌", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
