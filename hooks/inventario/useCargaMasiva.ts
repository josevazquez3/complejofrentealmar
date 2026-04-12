"use client";

import { useCallback, useState } from "react";

export type DetalleOmitidaCarga = { fila?: number; motivo?: string };

export type ResultadoCargaMasivaInventario = {
  importados: number;
  omitidas: number;
  detalleOmitidas: DetalleOmitidaCarga[];
  errores: string[];
};

export function useCargaMasiva() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCargaMasivaInventario | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetear = useCallback(() => {
    setResultado(null);
    setError(null);
  }, []);

  async function ejecutarCarga(file: File): Promise<void> {
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/inventario/carga-masiva", {
        method: "POST",
        body: formData,
      });
      let data: { error?: string } & Partial<ResultadoCargaMasivaInventario> = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Respuesta inválida del servidor");
      }
      if (!res.ok) {
        throw new Error(data.error || "Error desconocido");
      }
      setResultado({
        importados: data.importados ?? 0,
        omitidas: data.omitidas ?? 0,
        detalleOmitidas: data.detalleOmitidas ?? [],
        errores: data.errores ?? [],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return { ejecutarCarga, loading, resultado, error, resetear };
}
