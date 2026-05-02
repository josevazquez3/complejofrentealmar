/**
 * Ejecuta `migrate deploy` con PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=true.
 * Úsalo solo si ves P1002 / timeout en pg_advisory_lock con Neon u otro pooler.
 * No corras dos migraciones a la vez sin el lock.
 *
 * @see https://www.prisma.io/docs/reference/api-reference/environment-variables-reference
 */

import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const runner = join(__dirname, "prisma-with-local-env.mjs");

process.env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK = "true";

console.error(
  "[prisma] Migración sin advisory lock (solo uso puntual si P1002 en Neon). No ejecutes otra migrate en paralelo.\n"
);

const child = spawn(process.execPath, [runner, "migrate", "deploy"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: false,
});

child.on("exit", (code) => process.exit(code ?? 1));
