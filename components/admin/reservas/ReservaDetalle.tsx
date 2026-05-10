"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import type { EstadoReserva, ReservaAdmin } from "@/types";
import { formatFechaCorta, formatRangoFechas, formatRelativo } from "@/lib/format-fecha";
import { cambiarEstadoReserva, eliminarReservaAdmin } from "@/app/admin/(panel)/reservas/actions";
import {
  puedeConfirmarPorWhatsApp,
  tituloBotonWhatsapp,
  waMeUrlConfirmacionReserva,
} from "@/lib/wa-reserva-confirmacion";

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
  whatsappE164,
  whatsappMensaje,
  nombreComplejo,
  cuentaAlias,
  cuentaCbu,
  cuentaTexto,
}: {
  open: boolean;
  onClose: () => void;
  reserva: ReservaAdmin | null;
  whatsappE164: string;
  whatsappMensaje: string;
  nombreComplejo: string;
  cuentaAlias?: string | null;
  cuentaCbu?: string | null;
  cuentaTexto?: string | null;
}) {
  const { showToast } = useToast();
  const [seniaInput, setSeniaInput] = useState("");

  useEffect(() => {
    setSeniaInput("");
  }, [reserva?.id]);

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

  const checkWa = reserva
    ? puedeConfirmarPorWhatsApp(reserva.estado, whatsappE164, reserva.telefono)
    : ({ ok: false as const, razon: "" });
  const urlWa =
    reserva && checkWa.ok
      ? waMeUrlConfirmacionReserva(
          reserva,
          {
            whatsappE164,
            whatsappMensaje,
            nombreComplejo,
            cuentaAlias,
            cuentaCbu,
            cuentaTexto,
          },
          seniaInput || undefined
        )
      : null;
  const razonWa = checkWa.ok ? "" : checkWa.razon;
  const waTitle = reserva
    ? tituloBotonWhatsapp({ check: checkWa, url: urlWa, seniaOverride: seniaInput })
    : "";

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
                  {reserva.noches ?? "—"} noches
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-800">
                  <li>
                    <span className="font-medium text-fm-muted">Adultos:</span> {reserva.adultos}
                  </li>
                  <li>
                    <span className="font-medium text-fm-muted">Niños:</span> {reserva.ninos}
                  </li>
                  <li>
                    <span className="font-medium text-fm-muted">Mascotas:</span> {reserva.mascotas ?? 0}
                  </li>
                </ul>
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
                <div className="space-y-2">
                  {reserva.estado === "confirmada" ? (
                    <div
                      className="flex items-center gap-2 rounded-lg border border-fm-border bg-white px-3 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm text-fm-muted" aria-hidden>
                        💲
                      </span>
                      <input
                        type="text"
                        className="h-9 w-28 rounded-md border border-fm-border px-2 text-sm text-gray-800 outline-none placeholder:text-fm-muted focus:border-fm-red/40"
                        placeholder="Seña $"
                        value={seniaInput}
                        onChange={(e) => setSeniaInput(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : null}
                  {urlWa ? (
                    <a
                      href={urlWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-sm font-semibold uppercase tracking-widest text-white hover:bg-[#20bd5a]"
                      title={waTitle}
                    >
                      <FaWhatsapp className="h-5 w-5 shrink-0" aria-hidden />
                      Confirmar por WhatsApp
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-300 py-3 text-sm font-semibold uppercase tracking-widest text-gray-500"
                      title={waTitle}
                    >
                      <FaWhatsapp className="h-5 w-5 shrink-0 opacity-70" aria-hidden />
                      Confirmar por WhatsApp
                    </button>
                  )}
                  {!checkWa.ok ? (
                    <p className="text-center text-xs text-amber-800">{razonWa}</p>
                  ) : (
                    <p className="text-center text-xs text-fm-muted">
                      Se abre un chat con el teléfono del huésped y el texto de aprobación precargado.
                    </p>
                  )}
                </div>
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

