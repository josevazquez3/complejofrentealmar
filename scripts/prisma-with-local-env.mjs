/**
 * Carga .env luego .env.local (este gana), normaliza DATABASE_URL y ejecuta Prisma.
 * (El schema solo usa DATABASE_URL; Prisma no lee .env.local si corrés npx prisma a pelo.)
 *
 * Uso: node scripts/prisma-with-local-env.mjs migrate deploy
 */

import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

/** @param {string | undefined} v */
function cleanValue(v) {
  if (v == null) return v;
  return String(v)
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

/** @param {string} name */
function parseEnvFile(name) {
  const p = resolve(process.cwd(), name);
  if (!existsSync(p)) return {};
  let text = readFileSync(p, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  /** @type {Record<string, string>} */
  const out = {};
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
    out[key] = cleanValue(val) ?? "";
  }
  return out;
}

/** @param {string | undefined} u */
function isPostgresUrl(u) {
  const v = cleanValue(u);
  if (!v) return false;
  const low = v.toLowerCase();
  return low.startsWith("postgresql://") || low.startsWith("postgres://");
}

/** @param {string | undefined} u */
function isPlaceholder(u) {
  const t = cleanValue(u);
  if (!t) return true;
  if (/^\*+$/.test(t)) return true;
  if (/^(x+|X+|\?+|-+|\.)+$/.test(t)) return true;
  if (/placeholder|your_password|changeme|example\.com|^\*{4,}/i.test(t)) return true;
  return false;
}

/** @param {string | undefined} u */
function usablePostgresUrl(u) {
  return isPostgresUrl(u) && !isPlaceholder(u);
}

/** @param {string | undefined} u */
function usablePooledCandidate(u) {
  if (!usablePostgresUrl(u)) return false;
  return !cleanValue(u).toLowerCase().startsWith("prisma+");
}

/**
 * @param {string | undefined} host
 * @param {string | undefined} user
 * @param {string | undefined} pass
 * @param {string | undefined} db
 */
function urlFromParts(host, user, pass, db) {
  if (!host?.trim() || isPlaceholder(host) || isPlaceholder(user) || isPlaceholder(pass) || isPlaceholder(db))
    return null;
  const hNorm = host.trim();
  if (!hNorm.includes(".") && hNorm !== "localhost" && hNorm !== "127.0.0.1") return null;
  try {
    const u = encodeURIComponent(user.trim());
    const p = encodeURIComponent(pass.trim());
    const d = db.trim();
    return `postgresql://${u}:${p}@${hNorm}/${d}?sslmode=require`;
  } catch {
    return null;
  }
}

function resolveDatabaseUrl() {
  let pool = cleanValue(process.env.DATABASE_URL) ?? "";

  if (!usablePooledCandidate(pool)) {
    const tryPool =
      cleanValue(process.env.POSTGRES_URL) ||
      cleanValue(process.env.NEON_DATABASE_URL) ||
      "";
    if (usablePooledCandidate(tryPool)) pool = tryPool;
  }

  if (!usablePooledCandidate(pool)) {
    const built = urlFromParts(
      process.env.PGHOST,
      process.env.PGUSER,
      process.env.PGPASSWORD,
      process.env.PGDATABASE
    );
    if (built) pool = built;
  }

  if (!usablePooledCandidate(pool)) {
    const built = urlFromParts(
      process.env.POSTGRES_HOST,
      process.env.POSTGRES_USER,
      process.env.POSTGRES_PASSWORD,
      process.env.POSTGRES_DATABASE
    );
    if (built) pool = built;
  }

  if (pool) process.env.DATABASE_URL = pool;
}

const fromEnv = parseEnvFile(".env");
const fromLocal = parseEnvFile(".env.local");
const merged = { ...fromEnv, ...fromLocal };
for (const [key, val] of Object.entries(merged)) {
  process.env[key] = val;
}

resolveDatabaseUrl();

function diagnose() {
  const v = cleanValue(process.env.DATABASE_URL);
  console.error(`\n   Diagnóstico DATABASE_URL:`);
  console.error(`   · definida: ${v ? "sí" : "no"}`);
  console.error(`   · longitud: ${v?.length ?? 0}`);
  if (v) {
    console.error(`   · empieza con postgresql/postgres: ${/^postgres(ql)?:\/\//i.test(v)}`);
    console.error(`   · solo asteriscos: ${/^\*+$/.test(v)}`);
  }
}

function failUrl() {
  console.error(`\n❌ DATABASE_URL no es una URL PostgreSQL válida para Prisma.`);
  console.error("");
  console.error("   En .env.local pegá la URI completa desde Neon (Connection details).");
  console.error("   O creá un archivo .env en la raíz con DATABASE_URL=postgresql://... (Prisma lo lee solo).");
  console.error("");
  diagnose();
  console.error("");
  process.exit(1);
}

if (!usablePooledCandidate(process.env.DATABASE_URL)) failUrl();

const prismaArgs = process.argv.slice(2);
if (prismaArgs.length === 0) {
  console.error("Uso: node scripts/prisma-with-local-env.mjs <args de prisma…>");
  console.error("Ejemplo: node scripts/prisma-with-local-env.mjs migrate deploy");
  process.exit(1);
}

const child = spawn("npx", ["prisma", ...prismaArgs], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 1));
