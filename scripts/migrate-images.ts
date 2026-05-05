/**
 * Sube a Vercel Blob las imágenes que en la BD siguen como rutas locales (/uploads/…)
 * o rutas sin https, leyendo el archivo desde public/ y actualizando Prisma.
 *
 * Requisitos: DATABASE_URL, BLOB_READ_WRITE_TOKEN (p. ej. en .env.local)
 * Ejecutar: npm run migrate-images
 * (equivale a npx ts-node --project tsconfig.scripts.json scripts/migrate-images.ts)
 */

import { existsSync, readFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

function loadEnvFile(name: string): Record<string, string> {
  const p = path.resolve(process.cwd(), name);
  if (!existsSync(p)) return {};
  let text = readFileSync(p, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const out: Record<string, string> = {};
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
    out[key] = val.replace(/^\uFEFF/, "").trim();
  }
  return out;
}

function loadEnv(): void {
  const merged = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };
  for (const [k, v] of Object.entries(merged)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

function needsMigration(stored: string): boolean {
  const s = stored.trim();
  if (!s) return false;
  return !s.startsWith("https://");
}

/** Resuelve ruta en disco para valores guardados como /uploads/… o relativos a public/uploads. */
function resolvePublicFilePath(stored: string): string | null {
  const s = stored.trim();
  if (!s || s.includes("://")) return null;
  if (s.startsWith("/uploads/")) {
    return path.join(process.cwd(), "public", s.replace(/^\//, ""));
  }
  if (s.startsWith("uploads/")) {
    return path.join(process.cwd(), "public", s);
  }
  const cleaned = s.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", "uploads", cleaned);
}

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXT_TO_MIME[ext] ?? "application/octet-stream";
}

function blobToken(): string {
  const t = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!t) {
    console.error("❌ Falta BLOB_READ_WRITE_TOKEN en el entorno (.env / .env.local).");
    process.exit(1);
  }
  return t;
}

async function uploadLocalFileToBlob(absPath: string, logicalKey: string): Promise<string> {
  const buf = await readFile(absPath);
  const token = blobToken();
  const safePath = logicalKey.replace(/^\/+/, "");
  const blob = await put(safePath, buf, {
    access: "public",
    contentType: contentTypeFor(absPath),
    token,
  });
  return blob.url;
}

const migratedCache = new Map<string, string>();

/** Lee del disco, sube a Blob y devuelve la URL https pública. */
async function migrateUrlOnce(raw: string): Promise<string | null> {
  if (raw.startsWith("http://")) {
    console.warn(`   ⚠ Omitido (URL http externa, sin archivo local): ${raw}`);
    return null;
  }

  const abs = resolvePublicFilePath(raw);
  if (!abs || !existsSync(abs)) {
    console.warn(`   ⚠ Archivo no encontrado para: ${raw} (intentado: ${abs ?? "n/a"})`);
    return null;
  }

  const base = path.basename(abs);
  const folder = path.relative(path.join(process.cwd(), "public", "uploads"), path.dirname(abs)).replace(/\\/g, "/");
  const prefix = folder && folder !== "." ? `migrate/${folder}` : "migrate";
  const logicalKey = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}`;

  const newUrl = await uploadLocalFileToBlob(abs, logicalKey);
  console.log(`   Migrado: ${raw} → ${newUrl}`);
  return newUrl;
}

/** Evita subir dos veces la misma ruta antigua (p. ej. repetida en un array de fotos). */
async function migrateUrlCached(oldUrl: string): Promise<string | null> {
  const raw = oldUrl.trim();
  if (!needsMigration(raw)) return null;
  if (migratedCache.has(raw)) {
    return migratedCache.get(raw)!;
  }
  const out = await migrateUrlOnce(raw);
  if (out) migratedCache.set(raw, out);
  return out;
}

async function main(): Promise<void> {
  loadEnv();
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("❌ Falta DATABASE_URL.");
    process.exit(1);
  }
  blobToken();

  const prisma = new PrismaClient();

  try {
    const carousel = await prisma.carouselImage.findMany();
    for (const row of carousel) {
      let m: string | null = null;
      if (needsMigration(row.url)) m = await migrateUrlCached(row.url);
      else if (needsMigration(row.storagePath)) m = await migrateUrlCached(row.storagePath);
      if (m) {
        await prisma.carouselImage.update({
          where: { id: row.id },
          data: { url: m, storagePath: m },
        });
      }
    }

    const inicios = await prisma.inicioConfig.findMany();
    for (const row of inicios) {
      const fotos = row.fotos ?? [];
      let changed = false;
      const next = await Promise.all(
        fotos.map(async (f) => {
          const m = await migrateUrlCached(f);
          if (m) {
            changed = true;
            return m;
          }
          return f;
        })
      );
      if (changed) {
        await prisma.inicioConfig.update({
          where: { id: row.id },
          data: { fotos: next },
        });
      }
    }

    const casas = await prisma.casa.findMany();
    for (const row of casas) {
      const fotos = row.fotos ?? [];
      let changed = false;
      const next = await Promise.all(
        fotos.map(async (f) => {
          const m = await migrateUrlCached(f);
          if (m) {
            changed = true;
            return m;
          }
          return f;
        })
      );
      if (changed) {
        await prisma.casa.update({
          where: { id: row.id },
          data: { fotos: next },
        });
      }
    }

    const unidades = await prisma.unidad.findMany();
    for (const row of unidades) {
      const fotos = row.fotos ?? [];
      let changed = false;
      const next = await Promise.all(
        fotos.map(async (f) => {
          const m = await migrateUrlCached(f);
          if (m) {
            changed = true;
            return m;
          }
          return f;
        })
      );
      if (changed) {
        await prisma.unidad.update({
          where: { id: row.id },
          data: { fotos: next },
        });
      }
    }

    const configs = await prisma.configuracion.findMany();
    for (const row of configs) {
      const logo = row.logoUrl?.trim() ?? "";
      if (!logo || !needsMigration(logo)) continue;
      const m = await migrateUrlCached(logo);
      if (m) {
        await prisma.configuracion.update({
          where: { id: row.id },
          data: { logoUrl: m },
        });
      }
    }

    const reservas = await prisma.reserva.findMany({
      where: { comprobanteUrl: { not: null } },
    });
    for (const row of reservas) {
      const u = row.comprobanteUrl ?? "";
      if (!needsMigration(u)) continue;
      const m = await migrateUrlCached(u);
      if (m) {
        await prisma.reserva.update({
          where: { id: row.id },
          data: { comprobanteUrl: m },
        });
      }
    }

    const tesoreriaRows = await prisma.tesoreriaLegacy.findMany({
      where: { comprobanteUrl: { not: null } },
    });
    for (const row of tesoreriaRows) {
      const u = row.comprobanteUrl ?? "";
      if (!needsMigration(u)) continue;
      const m = await migrateUrlCached(u);
      if (m) {
        await prisma.tesoreriaLegacy.update({
          where: { id: row.id },
          data: { comprobanteUrl: m },
        });
      }
    }

    const movs = await prisma.tesoreriaMovimiento.findMany({
      where: { comprobante: { not: null } },
    });
    for (const row of movs) {
      const u = row.comprobante ?? "";
      if (!needsMigration(u)) continue;
      const m = await migrateUrlCached(u);
      if (m) {
        await prisma.tesoreriaMovimiento.update({
          where: { id: row.id },
          data: { comprobante: m },
        });
      }
    }

    console.log("\n✅ Migración de URLs finalizada.\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
