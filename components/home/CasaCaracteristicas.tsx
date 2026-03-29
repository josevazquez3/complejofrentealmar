"use client";

import { Bath, Car, Home, Users, Wifi } from "lucide-react";
import type { Casa } from "@/types";

type Item = {
  icon: typeof Users;
  value: string | number;
  label: string;
};

export function CasaCaracteristicas({ casa }: { casa: Casa }) {
  const items: Item[] = [
    { icon: Users, value: casa.capacidad_personas, label: "Personas" },
  ];

  if (casa.ambientes != null && casa.ambientes !== undefined) {
    items.push({ icon: Home, value: casa.ambientes, label: "Ambientes" });
  }
  if (casa.banos != null && casa.banos !== undefined) {
    items.push({ icon: Bath, value: casa.banos, label: "Baños" });
  }
  if (casa.lugares_cochera != null && casa.lugares_cochera !== undefined) {
    items.push({
      icon: Car,
      value: casa.lugares_cochera,
      label: "Cochera",
    });
  }
  if (casa.tiene_wifi === true) {
    items.push({ icon: Wifi, value: "Sí", label: "WiFi" });
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className="rounded-lg border border-fm-border bg-gray-50 p-4 text-center"
        >
          <Icon className="mx-auto h-6 w-6 text-fm-red" aria-hidden />
          <p className="mt-2 text-lg font-bold text-fm-text">{value}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-fm-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}
