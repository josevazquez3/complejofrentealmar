"use client";

import { createContext, useContext } from "react";
import type { Configuracion } from "@/types";

const ConfiguracionContext = createContext<Configuracion | null>(null);

export function ConfiguracionProvider({
  value,
  children,
}: {
  value: Configuracion;
  children: React.ReactNode;
}) {
  return (
    <ConfiguracionContext.Provider value={value}>{children}</ConfiguracionContext.Provider>
  );
}

/**
 * Configuración del complejo (fila única), ya fusionada con fallbacks.
 * Debe usarse dentro de `PublicShell`.
 */
export function useConfiguracion(): Configuracion {
  const ctx = useContext(ConfiguracionContext);
  if (!ctx) {
    throw new Error("useConfiguracion debe usarse dentro de ConfiguracionProvider");
  }
  return ctx;
}
