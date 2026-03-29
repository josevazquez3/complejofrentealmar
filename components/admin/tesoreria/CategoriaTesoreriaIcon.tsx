"use client";

import type { LucideIcon } from "lucide-react";
import {
  Home,
  Megaphone,
  MinusCircle,
  PlusCircle,
  Receipt,
  ShoppingCart,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Home,
  Zap,
  Sparkles,
  Wrench,
  Users,
  ShoppingCart,
  Receipt,
  Megaphone,
  PlusCircle,
  MinusCircle,
};

export function CategoriaTesoreriaIcon({
  icono,
  className,
}: {
  icono?: string | null;
  className?: string;
}) {
  const Icon = icono && MAP[icono] ? MAP[icono] : PlusCircle;
  return <Icon className={className ?? "h-4 w-4 shrink-0"} />;
}
