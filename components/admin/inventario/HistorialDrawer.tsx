"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { InventarioItemConMovimientos, InventarioMovimiento, TipoMovimiento } from "@/types";
import { formatRelativo } from "@/lib/format-fecha";
import { obtenerItemConMovimientos } from "@/app/admin/(panel)/inventario/actions";

function iconTipo(tipo: TipoMovimiento) {
  switch (tipo) {
    case "entrada":
      return { Icon: ArrowDownCircle, className: "text-green-600" };
    case "salida":
      return { Icon: ArrowUpCircle, className: "text-red-500" };
    case "ajuste":
      return { Icon: RefreshCw, className: "text-blue-500" };
    default:
      return { Icon: Trash2, className: "text-gray-400" };
  }
}

function labelTipo(tipo: TipoMovimiento) {
  switch (tipo) {
    case "entrada":
      return "Entrada";
    case "salida":
      return "Salida";
    case "ajuste":
      return "Ajuste";
    case "baja":
      return "Baja";
    default:
      return tipo;
  }
}

export function HistorialDrawer({
  open,
  onClose,
  itemId,
  nombreItem,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string | null;
  nombreItem: string;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InventarioItemConMovimientos | null>(null);

  useEffect(() => {
    if (!open || !itemId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    obtenerItemConMovimientos(itemId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok && res.data) setData(res.data);
      else setData(null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  const movs: InventarioMovimiento[] = Array.isArray(data?.inventario_movimientos)
    ? data!.inventario_movimientos
    : [];

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl"
            role="dialog"
            aria-modal
          >
            <div className="flex items-center justify-between border-b border-fm-border p-5">
              <div>
                <p className="text-sm font-semibold text-gray-800">Historial — {nombreItem}</p>
                <p className="mt-1 text-xs text-fm-muted">Movimientos de stock</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-fm-muted hover:bg-gray-100"
                aria-label="Cerrar panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {loading ? (
                <p className="py-8 text-center text-sm text-fm-muted">Cargando…</p>
              ) : movs.length === 0 ? (
                <p className="py-8 text-center text-sm text-fm-muted">Sin movimientos registrados</p>
              ) : (
                <ul className="space-y-4">
                  {movs.map((m) => {
                    const { Icon, className } = iconTipo(m.tipo);
                    return (
                      <li key={m.id} className="rounded-lg border border-fm-border p-3">
                        <div className="flex items-start gap-3">
                          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${className}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">{labelTipo(m.tipo)}</span>
                              <span className="text-xs text-fm-muted">{formatRelativo(m.created_at)}</span>
                            </div>
                            <p className="mt-1 text-xs text-fm-muted">
                              Cantidad: <span className="font-medium text-gray-700">{m.cantidad}</span>
                            </p>
                            {m.motivo ? (
                              <p className="mt-1 text-sm text-gray-700">{m.motivo}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-fm-muted">
                              {m.cantidad_anterior} → {m.cantidad_nueva}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
