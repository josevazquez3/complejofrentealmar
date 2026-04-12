import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** URLs absolutas: usar `unoptimized` en `next/image` evita 400 del optimizador si el host no está en `remotePatterns`. */
export function esUrlImagenAbsoluta(src: string): boolean {
  const s = src.trim();
  return s.startsWith("http://") || s.startsWith("https://");
}
