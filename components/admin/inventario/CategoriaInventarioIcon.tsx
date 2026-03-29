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

const MAP: Record<string, LucideIcon> = {
  Sofa,
  Tv,
  UtensilsCrossed,
  Bed,
  ShowerHead,
  Sparkles,
  Plug,
  Umbrella,
  Package,
};

export function CategoriaInventarioIcon({
  icono,
  className,
}: {
  icono?: string | null;
  className?: string;
}) {
  const Icon = (icono && MAP[icono]) ? MAP[icono] : Package;
  return <Icon className={className ?? "h-4 w-4 shrink-0"} />;
}
