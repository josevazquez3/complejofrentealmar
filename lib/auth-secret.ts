/**
 * NEXTAUTH_SECRET es obligatoria en producción (Vercel / next start).
 * En `next dev` se usa un valor fijo si falta, para no romper el panel local.
 */
export function getNextAuthSecret(): string | undefined {
  const fromEnv = process.env.NEXTAUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }
  return "__local_dev_nextauth_secret__";
}
