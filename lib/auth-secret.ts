const FALLBACK_LOCAL =
  process.env.NEXTAUTH_SECRET_FALLBACK?.trim() || "__local_dev_nextauth_secret__";

/**
 * Secreto para firmar JWT de NextAuth / Auth.js.
 * Lee `NEXTAUTH_SECRET` o `AUTH_SECRET` (Auth.js v5).
 * En Vercel: definí `NEXTAUTH_SECRET` en Project → Settings → Environment Variables (no subas secretos al repo).
 */
export function getNextAuthSecret(): string {
  const fromEnv =
    process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[auth] Definí NEXTAUTH_SECRET o AUTH_SECRET (Vercel: Environment Variables). Usando valor de desarrollo."
    );
  }
  return FALLBACK_LOCAL;
}
