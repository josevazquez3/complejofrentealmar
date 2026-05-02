/**
 * Variables de entorno. Las `NEXT_PUBLIC_*` se inyectan en el cliente en build.
 */
export const env = {
  complexName: process.env.NEXT_PUBLIC_COMPLEX_NAME ?? "Complejo Frente al Mar",
  /** URL pública del GIF promocional (ej. `/promo.gif` en `public/` o URL absoluta en Vercel Blob). Vacío = no se muestra bloque. */
  promoGifUrl: process.env.NEXT_PUBLIC_PROMO_GIF_URL?.trim() ?? "",
} as const;

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function assertDatabaseConfigured(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "Falta DATABASE_URL. En Neon: connection string con pooling. Revisá .env.local o Vercel."
    );
  }
}
