import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** URLs absolutas (http/https). */
export function esUrlImagenAbsoluta(src: string): boolean {
  const s = src.trim();
  return s.startsWith("http://") || s.startsWith("https://");
}

/**
 * Usar `unoptimized` en `next/image` para evitar 400 en `/_next/image`:
 * hosts no listados en `remotePatterns`, y rutas `/…` típicas de BD cuando el archivo ya no está en `public`.
 */
export function evitarOptimizadorNextImage(src: string): boolean {
  const s = src.trim();
  return esUrlImagenAbsoluta(s) || s.startsWith("/");
}
