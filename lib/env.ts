/**
 * Variables de entorno públicas (Next.js inyecta NEXT_PUBLIC_* en cliente y build).
 * No lanzar errores en tiempo de importación para no romper `next build` sin .env local.
 */
/** Anon / publishable: mismo valor; Vercel+Supabase suelen usar PUBLISHABLE_KEY. */
const supabaseAnonOrPublishable =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: supabaseAnonOrPublishable,
  googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  complexName: process.env.NEXT_PUBLIC_COMPLEX_NAME ?? "Complejo Frente al Mar",
  /** ID del video institucional de YouTube (solo el ID, ej: dQw4w9WgXcQ). */
  youtubeVideoId: process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID ?? "",
} as const;

export function assertSupabaseConfigured(): void {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o la clave pública (NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Revisá .env.local o Vercel."
    );
  }
}
