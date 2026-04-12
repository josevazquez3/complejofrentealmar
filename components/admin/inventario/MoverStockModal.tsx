"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import type { InventarioItem, TipoMovimiento } from "@/types";
import { moverStock } from "@/app/admin/(panel)/inventario/actions";
import { useRouter } from "next/navigation";

type TabTipo = "entrada" | "salida" | "ajuste";

export function MoverStockModal({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: InventarioItem | null;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<TabTipo>("entrada");
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open && item) {
      setTab("entrada");
      setCantidad(1);
      setMotivo("");
    }
  }, [open, item]);

  useEffect(() => {
    if (!item || !open) return;
    if (tab === "ajuste") setCantidad(item.cantidad);
  }, [tab, item, open]);

  const stockActual = item?.cantidad ?? 0;
  const cantidadMin = item?.cantidad_min ?? 0;

  const nuevoStock = useMemo(() => {
    if (tab === "entrada") return stockActual + Math.max(0, cantidad);
    if (tab === "salida") return stockActual - Math.max(0, cantidad);
    return Math.max(0, cantidad);
  }, [tab, cantidad, stockActual]);

  const tipoMov: TipoMovimiento = tab;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    const c = tab === "ajuste" ? Math.max(0, cantidad) : Math.max(1, cantidad);
    if (nuevoStock < 0) {
      showToast("Stock no puede ser negativo.", "error");
      return;
    }
    setPending(true);
    try {
      const res = await moverStock(item.id, tipoMov, c, motivo.trim() || undefined);
      if (res.ok) {
        showToast("Movimiento registrado.", "success");
        router.refresh();
        onClose();
      } else showToast(res.error ?? "No se pudo registrar.", "error");
    } finally {
      setPending(false);
    }
  }

  const invalido = nuevoStock < 0;
  const stockBajoWarn = !invalido && nuevoStock <= cantidadMin && nuevoStock >= 0;

  return (
    <AnimatePresence>
      {open && item ? (
        <motion.div
          key="mover-stock"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60"
            onClick={onClose}
          />
          <div className="relative flex min-h-[100dvh] items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative z-10 w-full max-w-sm max-h-[min(90dvh,40rem)] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
              role="dialog"
              aria-modal
              onClick={(e) => e.stopPropagation()}
            >
            <h2 className="text-base font-semibold text-gray-800">Stock: {item.nombre}</h2>
            <p className="mt-3 text-2xl font-bold text-gray-900">{stockActual}</p>
            <p className="text-xs text-fm-muted">Stock actual</p>

            <p className="mt-4 text-xs font-medium text-fm-muted">Tipo de movimiento</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["entrada", "Entrada"],
                  ["salida", "Salida"],
                  ["ajuste", "Ajuste"],
                ] as const
              ).map(([k, label]) => {
                const active = tab === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active ? "bg-fm-red text-white" : "border border-fm-border text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-fm-muted">
                  {tab === "ajuste" ? "Cantidad final" : "Cantidad"}
                </label>
                <input
                  type="number"
                  min={tab === "ajuste" ? 0 : 1}
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Motivo (opcional)</label>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                />
              </div>
              <p className="text-sm text-fm-muted">
                Stock actual: {stockActual} → Nuevo stock: {nuevoStock}
              </p>
              {stockBajoWarn ? (
                <p className="text-sm text-yellow-600">⚠ Quedará en stock bajo</p>
              ) : null}
              {invalido ? <p className="text-sm text-red-600">✗ No puede ser negativo</p> : null}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-fm-border py-2 text-sm text-gray-800 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending || invalido}
                  className="flex-1 rounded-lg bg-fm-red py-2 text-sm font-bold uppercase tracking-wide text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Registrar movimiento
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
