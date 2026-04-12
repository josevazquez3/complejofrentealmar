"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bed,
  Package,
  Plug,
  ShowerHead,
  Sofa,
  Sparkles,
  Tv,
  Umbrella,
  UtensilsCrossed,
} from "lucide-react";
import type { InventarioCategoriaIconKey } from "@/lib/inventario-categoria-icons";

const MAP = {
  Sofa,
  Tv,
  UtensilsCrossed,
  Bed,
  ShowerHead,
  Sparkles,
  Plug,
  Umbrella,
  Package,
} satisfies Record<InventarioCategoriaIconKey, LucideIcon>;

export function CategoriaInventarioIcon({
  icono,
  className,
}: {
  icono?: string | null;
  className?: string;
}) {
  const Icon =
    icono && icono in MAP ? MAP[icono as InventarioCategoriaIconKey] : Package;
  return <Icon className={className ?? "h-4 w-4 shrink-0"} />;
}
