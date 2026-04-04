/**
 * Crea o actualiza un usuario en la tabla `usuarios` (Prisma / bcrypt).
 *
 * Requisitos: DATABASE_URL en .env.local o .env
 * Uso: npm run create-admin
 *
 * Opcional: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE, ADMIN_ROL (SUPER_ADMIN | ADMIN | EMPLEADO)
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
const nombre = (process.env.ADMIN_NOMBRE || "Administrador").trim() || "Administrador";
const rolRaw = (process.env.ADMIN_ROL || "SUPER_ADMIN").trim().toUpperCase();
const rol = ["SUPER_ADMIN", "ADMIN", "EMPLEADO"].includes(rolRaw) ? rolRaw : "SUPER_ADMIN";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("\n❌ Falta DATABASE_URL (Neon / PostgreSQL).\n");
  console.error("Definilo en .env.local (o .env) con la connection string de Neon.\n");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const hash = await bcrypt.hash(password, 10);
  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) {
    await prisma.usuario.update({
      where: { email },
      data: { password: hash, nombre, activo: true },
    });
    console.log("\n✅ Usuario actualizado (contraseña y nombre renovados).\n");
  } else {
    await prisma.usuario.create({
      data: { email, password: hash, nombre, rol },
    });
    console.log("\n✅ Usuario creado.\n");
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
