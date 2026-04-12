"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ResultadoCargaMasivaInventario } from "@/hooks/inventario/useCargaMasiva";

type Props = {
  open: boolean;
  onClose: () => void;
  resultado: ResultadoCargaMasivaInventario | null;
  error: string | null;
};

export function ModalResultadoCarga({ open, onClose, resultado, error }: Props) {
  const router = useRouter();
  const [omitidasOpen, setOmitidasOpen] = useState(false);

  useEffect(() => {
    if (!open) setOmitidasOpen(false);
  }, [open]);

  function handleVerInventario() {
    router.refresh();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Resultado de la importación</DialogTitle>
        </DialogHeader>

        {error ? (
          <div className="flex items-center gap-2 text-red-600">
            <span aria-hidden>❌</span>
            <span>{error}</span>
          </div>
        ) : null}

        {!error && resultado ? (
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-green-700">
              <span aria-hidden>✅</span>
              {resultado.importados} artículos importados correctamente
            </p>

            {resultado.omitidas > 0 ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-900">
                <p className="flex items-center gap-2 font-medium">
                  <span aria-hidden>⚠️</span>
                  {resultado.omitidas} filas omitidas
                </p>
                {resultado.detalleOmitidas.length > 0 ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setOmitidasOpen((o) => !o)}
                      className="text-xs font-semibold text-yellow-800 underline"
                    >
                      {omitidasOpen ? "Ocultar detalle" : "Ver detalle"}
                    </button>
                    {omitidasOpen ? (
                      <ul className="mt-2 max-h-40 list-inside list-disc space-y-1 overflow-y-auto text-xs">
                        {resultado.detalleOmitidas.map((d, i) => (
                          <li key={`${d.fila}-${i}`}>
                            Fila {d.fila ?? "?"}: {d.motivo ?? "—"}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {resultado.errores.length > 0 ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
                <p className="mb-2 flex items-center gap-2 font-medium">
                  <span aria-hidden>❌</span>
                  Errores
                </p>
                <ul className="max-h-36 list-inside list-disc space-y-1 overflow-y-auto text-xs">
                  {resultado.errores.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          {resultado && resultado.importados > 0 ? (
            <Button
              type="button"
              className="w-full bg-fm-red text-white hover:bg-red-700 sm:w-auto"
              onClick={handleVerInventario}
            >
              Ver inventario
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
