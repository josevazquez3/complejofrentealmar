/** Claves guardadas en `inventario_categorias.icono` (lucide-react, ver `CategoriaInventarioIcon`). */
export const INVENTARIO_CATEGORIA_ICON_KEYS = [
  "Sofa",
  "Tv",
  "UtensilsCrossed",
  "Bed",
  "ShowerHead",
  "Sparkles",
  "Plug",
  "Umbrella",
  "Package",
] as const;

export type InventarioCategoriaIconKey = (typeof INVENTARIO_CATEGORIA_ICON_KEYS)[number];

export function normalizeInventarioCategoriaIcono(
  raw: string | null | undefined
): string | null {
  const s = raw?.trim();
  if (!s) return null;
  return (INVENTARIO_CATEGORIA_ICON_KEYS as readonly string[]).includes(s) ? s : null;
}
