"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { EstadoReserva, ReservaAdmin } from "@/types";
import { formatFechaCorta, formatRangoFechas, formatRelativo } from "@/lib/format-fecha";
import { cambiarEstadoReserva, eliminarReservaAdmin } from "@/app/admin/(panel)/reservas/actions";

function badgeClass(estado: EstadoReserva | null | undefined): string {
  if (estado === "confirmada") return "bg-green-100 text-green-700";
  if (estado === "cancelada") return "bg-red-100 text-red-600";
  return "bg-yellow-100 text-yellow-700";
}

function labelEstado(estado: EstadoReserva | null | undefined): string {
  if (estado === "confirmada") return "Confirmada";
  if (estado === "cancelada") return "Cancelada";
  return "Pendiente";
}

export function ReservaDetalle({
  open,
  onClose,
  reserva,
}: {
  open: boolean;
  onClose: () => void;
  reserva: ReservaAdmin | null;
}) {
  const { showToast } = useToast();

  async function setEstado(estado: EstadoReserva) {
    if (!reserva) return;
    const res = await cambiarEstadoReserva(reserva.id, estado);
    if (res.ok) {
      showToast("Estado actualizado.", "success");
      onClose();
    } else {
      showToast(res.error ?? "No se pudo actualizar.", "error");
    }
  }

  async function onDelete() {
    if (!reserva) return;
    const res = await eliminarReservaAdmin(reserva.id);
    if (res.ok) {
      showToast("Reserva eliminada.", "success");
      onClose();
    } else {
      showToast(res.error ?? "No se pudo eliminar.", "error");
    }
  }

  return (
    <AnimatePresence>
      {open && reserva ? (
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
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl"
            role="dialog"
            aria-modal
          >
            <div className="flex items-center justify-between border-b border-fm-border p-5">
              <div>
                <p className="text-sm font-semibold text-gray-800">Detalle de Reserva</p>
                <p className="mt-1 text-xs text-fm-muted">{formatRelativo(reserva.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-fm-muted">Unidad</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-800">{reserva.casas?.nombre ?? "—"}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClass(reserva.estado)}`}>
                    {labelEstado(reserva.estado)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-fm-muted">Huésped</p>
                <p className="mt-2 font-medium text-gray-800">
                  {(reserva.nombre ?? "").trim()} {(reserva.apellido ?? "").trim()}
                </p>
                {reserva.email ? (
                  <a className="mt-1 block text-sm text-fm-red hover:underline" href={`mailto:${reserva.email}`}>
                    {reserva.email}
                  </a>
                ) : null}
                {reserva.telefono ? (
                  <a className="mt-1 block text-sm text-fm-muted hover:underline" href={`tel:${reserva.telefono}`}>
                    {reserva.telefono}
                  </a>
                ) : null}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-fm-muted">Estadía</p>
                <p className="mt-2 text-sm text-gray-800">
                  {formatRangoFechas(reserva.fecha_desde, reserva.fecha_hasta)}
                </p>
                <p className="mt-1 text-sm text-fm-muted">
                  {formatFechaCorta(reserva.fecha_desde)} → {formatFechaCorta(reserva.fecha_hasta)} ·{" "}
                  {reserva.noches ?? "—"} noches · {reserva.cant_personas} personas
                </p>
              </div>

              {reserva.mensaje?.trim() ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-fm-muted">Mensaje</p>
                  <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{reserva.mensaje}</p>
                </div>
              ) : null}

              <div className="rounded-xl border border-fm-border bg-gray-50 p-4 text-sm">
                <p className="text-fm-muted">
                  <span className="font-medium text-gray-800">Creada:</span>{" "}
                  {new Date(reserva.created_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
                </p>
                <p className="mt-2 text-fm-muted">
                  <span className="font-medium text-gray-800">ID:</span> {reserva.id.slice(0, 8)}
                </p>
              </div>

              <div className="space-y-3">
                {reserva.estado !== "confirmada" ? (
                  <button
                    type="button"
                    onClick={() => setEstado("confirmada")}
                    className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold uppercase tracking-widest text-white hover:bg-green-700"
                  >
                    Confirmar
                  </button>
                ) : null}
                {reserva.estado !== "cancelada" ? (
                  <button
                    type="button"
                    onClick={() => setEstado("cancelada")}
                    className="w-full rounded-lg bg-yellow-500 py-3 text-sm font-semibold uppercase tracking-widest text-white hover:bg-yellow-600"
                  >
                    Cancelar
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onDelete}
                  className="w-full rounded-lg border border-red-500 py-3 text-sm font-semibold uppercase tracking-widest text-red-500 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

