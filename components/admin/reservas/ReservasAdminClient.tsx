"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import type { Casa, EstadoReserva, FiltroEstado, FiltroOrden, ReservaAdmin } from "@/types";
import { formatFechaCorta, formatRangoFechas } from "@/lib/format-fecha";
import { cn } from "@/lib/utils";
import { guardarConfiguracion } from "@/app/admin/(panel)/configuracion/actions";
import { cambiarEstadoReserva, eliminarReservaAdmin } from "@/app/admin/(panel)/reservas/actions";
import { configuracionToGuardarFormData } from "@/lib/configuracion-to-form-data";
import {
  mensajeWhatsappParaEditor,
  puedeConfirmarPorWhatsApp,
  tituloBotonWhatsapp,
  waMeUrlConfirmacionReserva,
  WHATSAPP_MENSAJE_DEFAULT,
} from "@/lib/wa-reserva-confirmacion";
import type { Configuracion } from "@/types";
import { EditarMensajeWhatsappModal } from "./EditarMensajeWhatsappModal";
import { ReservaDetalle } from "./ReservaDetalle";
import { NuevaReservaModal } from "./NuevaReservaModal";

function badgeEstado(estado: EstadoReserva | null | undefined) {
  if (estado === "confirmada") return "bg-green-100 text-green-700";
  if (estado === "cancelada") return "bg-red-100 text-red-600";
  return "bg-yellow-100 text-yellow-700";
}

function labelEstado(estado: EstadoReserva | null | undefined) {
  if (estado === "confirmada") return "confirmada";
  if (estado === "cancelada") return "cancelada";
  return "pendiente";
}

function safeStr(x: unknown): string {
  return String(x ?? "").toLowerCase();
}

export function ReservasAdminClient({
  reservas,
  casasActivas,
  currentPage,
  totalPages,
  total,
  kpis,
  initialEstado = "todos",
  configuracionCompleta,
  whatsappE164,
  whatsappMensaje,
  nombreComplejo,
}: {
  reservas: ReservaAdmin[];
  casasActivas: Casa[];
  currentPage: number;
  totalPages: number;
  total: number;
  kpis: { pendientes: number; confirmadas: number; canceladas: number; proximas: number };
  initialEstado?: FiltroEstado;
  configuracionCompleta: Configuracion;
  whatsappE164: string;
  whatsappMensaje: string;
  nombreComplejo: string;
}) {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>(initialEstado);
  const [filtroUnidad, setFiltroUnidad] = useState<string>("__all__");
  const [filtroMes, setFiltroMes] = useState<string>(""); // YYYY-MM
  const [orden, setOrden] = useState<FiltroOrden>("recientes");

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalle, setDetalle] = useState<ReservaAdmin | null>(null);
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ReservaAdmin | null>(null);
  const [seniaMap, setSeniaMap] = useState<Record<string, string>>({});
  const [modalMensajeOpen, setModalMensajeOpen] = useState(false);
  const [mensajeEditado, setMensajeEditado] = useState(() => mensajeWhatsappParaEditor(whatsappMensaje));
  const [whatsappMensajeActivo, setWhatsappMensajeActivo] = useState(() =>
    mensajeWhatsappParaEditor(whatsappMensaje)
  );
  const [guardandoMensaje, setGuardandoMensaje] = useState(false);
  const [mensajeGuardadoOk, setMensajeGuardadoOk] = useState(false);

  useEffect(() => {
    const w = mensajeWhatsappParaEditor(whatsappMensaje);
    setMensajeEditado(w);
    setWhatsappMensajeActivo(w);
  }, [whatsappMensaje]);

  const casasDeReservas = useMemo(() => {
    const map = new Map<string, string>();
    reservas.forEach((r) => {
      if (r.casas?.id && r.casas?.nombre) map.set(r.casas.id, r.casas.nombre);
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [reservas]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hoy = new Date().toISOString().slice(0, 10);

    let rows = reservas.filter((r) => {
      if (filtroEstado !== "todos" && (r.estado ?? "pendiente") !== filtroEstado) return false;
      if (filtroUnidad !== "__all__" && r.casas?.id !== filtroUnidad) return false;
      if (filtroMes) {
        const m = r.fecha_desde.slice(0, 7);
        if (m !== filtroMes) return false;
      }
      if (q) {
        const hay =
          safeStr(r.nombre).includes(q) ||
          safeStr(r.apellido).includes(q) ||
          safeStr(r.email).includes(q) ||
          safeStr(r.casas?.nombre).includes(q);
        if (!hay) return false;
      }
      return true;
    });

    rows = rows.sort((a, b) => {
      if (orden === "antiguas") return a.created_at.localeCompare(b.created_at);
      if (orden === "proximas") {
        const aKey =
          (a.estado === "confirmada" && a.fecha_desde >= hoy ? "0" : "1") + a.fecha_desde + a.created_at;
        const bKey =
          (b.estado === "confirmada" && b.fecha_desde >= hoy ? "0" : "1") + b.fecha_desde + b.created_at;
        return aKey.localeCompare(bKey);
      }
      return b.created_at.localeCompare(a.created_at);
    });

    return rows;
  }, [reservas, query, filtroEstado, filtroUnidad, filtroMes, orden]);

  async function doEstado(id: string, estado: EstadoReserva) {
    const res = await cambiarEstadoReserva(id, estado);
    if (res.ok) showToast("Estado actualizado.", "success");
    else showToast(res.error ?? "No se pudo actualizar.", "error");
  }

  async function doDelete(id: string) {
    const res = await eliminarReservaAdmin(id);
    if (res.ok) showToast("Reserva eliminada.", "success");
    else showToast(res.error ?? "No se pudo eliminar.", "error");
  }

  async function handleGuardarMensaje() {
    setGuardandoMensaje(true);
    try {
      const fd = configuracionToGuardarFormData(configuracionCompleta, mensajeEditado);
      const res = await guardarConfiguracion(fd);
      if (!res.success) {
        showToast(res.error ?? "No se pudo guardar.", "error");
        return;
      }
      setWhatsappMensajeActivo(mensajeEditado);
      setMensajeGuardadoOk(true);
      setTimeout(() => {
        setModalMensajeOpen(false);
        setMensajeGuardadoOk(false);
      }, 2000);
    } finally {
      setGuardandoMensaje(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Reservas</h1>
          <p className="mt-1 text-sm text-fm-muted">{total} reservas registradas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setModalMensajeOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-green-500 px-4 py-2 font-medium text-green-600 transition hover:bg-green-50"
          >
            <FaWhatsapp className="text-green-500" />
            Editar Mensaje WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setNuevaOpen(true)}
            className="rounded-lg bg-fm-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            + Nueva Reserva
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative rounded-xl border border-fm-border bg-white p-5 shadow-sm">
          <Clock className="absolute right-4 top-4 h-6 w-6 text-yellow-700" />
          <p className="text-3xl font-bold text-gray-800">{kpis.pendientes}</p>
          <p className="mt-1 text-sm text-fm-muted">Pendientes</p>
          <span className="mt-3 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
            Pendientes
          </span>
        </div>
        <div className="relative rounded-xl border border-fm-border bg-white p-5 shadow-sm">
          <CheckCircle className="absolute right-4 top-4 h-6 w-6 text-green-700" />
          <p className="text-3xl font-bold text-gray-800">{kpis.confirmadas}</p>
          <p className="mt-1 text-sm text-fm-muted">Confirmadas</p>
          <span className="mt-3 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Confirmadas
          </span>
        </div>
        <div className="relative rounded-xl border border-fm-border bg-white p-5 shadow-sm">
          <CalendarDays className="absolute right-4 top-4 h-6 w-6 text-blue-700" />
          <p className="text-3xl font-bold text-gray-800">{kpis.proximas}</p>
          <p className="mt-1 text-sm text-fm-muted">Próximas</p>
          <span className="mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            Próximas
          </span>
        </div>
        <div className="relative rounded-xl border border-fm-border bg-white p-5 shadow-sm">
          <XCircle className="absolute right-4 top-4 h-6 w-6 text-red-600" />
          <p className="text-3xl font-bold text-gray-800">{kpis.canceladas}</p>
          <p className="mt-1 text-sm text-fm-muted">Canceladas</p>
          <span className="mt-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600">
            Canceladas
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fm-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email o unidad..."
            className="w-72 rounded-lg border border-fm-border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-fm-red"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["todos", "Todos"],
              ["pendiente", "Pendientes"],
              ["confirmada", "Confirmadas"],
              ["cancelada", "Canceladas"],
            ] as const
          ).map(([val, label]) => {
            const active = filtroEstado === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setFiltroEstado(val as FiltroEstado)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-fm-red text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <select
          value={filtroUnidad}
          onChange={(e) => setFiltroUnidad(e.target.value)}
          className="rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
        >
          <option value="__all__">Todas las unidades</option>
          {casasDeReservas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          className="rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
        />

        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as FiltroOrden)}
          className="rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
        >
          <option value="recientes">Más recientes</option>
          <option value="proximas">Próximas primero</option>
          <option value="antiguas">Más antiguas</option>
        </select>
      </div>

      <div className="hidden md:block overflow-hidden rounded-xl border border-fm-border bg-white shadow-sm">
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-fm-muted">
              <tr className="border-b border-fm-border">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3">Huésped</th>
                <th className="px-4 py-3">Fechas</th>
                <th className="px-4 py-3">Noches</th>
                <th className="px-4 py-3">A / N / Masc.</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fm-border">
              {filtered.map((r, idx) => {
                const estado = (r.estado ?? "pendiente") as EstadoReserva;
                const canConfirm = estado !== "confirmada";
                const canCancel = estado !== "cancelada";
                const puedeConfirmar = puedeConfirmarPorWhatsApp(estado, whatsappE164, r.telefono);
                const waConfig = {
                  whatsappE164,
                  whatsappMensaje: whatsappMensajeActivo,
                  nombreComplejo,
                } as const;
                const url = puedeConfirmar.ok
                  ? waMeUrlConfirmacionReserva(r, waConfig, seniaMap[r.id] ?? "")
                  : null;
                const waTitle = tituloBotonWhatsapp({
                  check: puedeConfirmar,
                  url,
                  seniaOverride: seniaMap[r.id],
                });
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-fm-muted">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.casas?.nombre ?? "—"}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {(r.nombre ?? "").trim()} {(r.apellido ?? "").trim()}
                      </p>
                      <p className="text-xs text-fm-muted">{r.email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{formatRangoFechas(r.fecha_desde, r.fecha_hasta)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {r.noches ?? "—"} noches
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-gray-800">
                        <User className="h-4 w-4 shrink-0 text-fm-muted" />
                        <span className="text-xs">
                          {r.adultos} / {r.ninos} / {r.mascotas ?? 0}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeEstado(estado)}`}>
                        {labelEstado(estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Ver detalle"
                          className="rounded-lg p-2 text-fm-muted hover:bg-gray-100 hover:text-fm-red"
                          onClick={() => {
                            setDetalle(r);
                            setDetalleOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {estado === "confirmada" ? (
                          <div
                            className="flex h-8 shrink-0 items-center gap-0.5 rounded-lg border border-fm-border bg-white px-1.5"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <span className="select-none text-xs leading-none text-fm-muted" aria-hidden>
                              💲
                            </span>
                            <input
                              type="text"
                              className="h-6 w-24 min-w-0 rounded-md border-0 bg-transparent px-0.5 text-xs text-gray-800 outline-none placeholder:text-fm-muted focus:ring-0"
                              placeholder="Seña $"
                              value={seniaMap[r.id] ?? ""}
                              onChange={(e) =>
                                setSeniaMap((prev) => ({ ...prev, [r.id]: e.target.value }))
                              }
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : null}
                        <button
                          type="button"
                          title={waTitle}
                          disabled={!url}
                          className={cn(
                            "rounded-lg p-2",
                            url
                              ? "text-[#25D366] hover:bg-green-50"
                              : "cursor-not-allowed text-gray-300"
                          )}
                          onClick={() => {
                            if (url) window.open(url, "_blank", "noopener,noreferrer");
                          }}
                        >
                          <FaWhatsapp className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          title="Confirmar"
                          disabled={!canConfirm}
                          className={cn(
                            "rounded-lg p-2 hover:bg-gray-100",
                            canConfirm ? "text-fm-muted hover:text-green-700" : "cursor-not-allowed text-gray-300"
                          )}
                          onClick={() => doEstado(r.id, "confirmada")}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Cancelar"
                          disabled={!canCancel}
                          className={cn(
                            "rounded-lg p-2 hover:bg-gray-100",
                            canCancel ? "text-fm-muted hover:text-yellow-700" : "cursor-not-allowed text-gray-300"
                          )}
                          onClick={() => doEstado(r.id, "cancelada")}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          className="rounded-lg p-2 text-fm-muted hover:bg-red-50 hover:text-red-600"
                          onClick={() => setConfirmDelete(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-fm-muted">
                    No hay reservas para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map((r) => {
          const estado = (r.estado ?? "pendiente") as EstadoReserva;
          const puedeConfirmar = puedeConfirmarPorWhatsApp(estado, whatsappE164, r.telefono);
          const waConfig = {
            whatsappE164,
            whatsappMensaje: whatsappMensajeActivo,
            nombreComplejo,
          } as const;
          const url = puedeConfirmar.ok
            ? waMeUrlConfirmacionReserva(r, waConfig, seniaMap[r.id] ?? "")
            : null;
          const waTitleMob = tituloBotonWhatsapp({
            check: puedeConfirmar,
            url,
            seniaOverride: seniaMap[r.id],
          });
          return (
            <div key={r.id} className="rounded-xl border border-fm-border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeEstado(estado)}`}>
                  {labelEstado(estado)}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-fm-muted hover:bg-gray-100 hover:text-fm-red"
                    onClick={() => {
                      setDetalle(r);
                      setDetalleOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {estado === "confirmada" ? (
                    <div
                      className="flex h-8 shrink-0 items-center gap-0.5 rounded-lg border border-fm-border bg-white px-1.5"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <span className="select-none text-xs leading-none text-fm-muted" aria-hidden>
                        💲
                      </span>
                      <input
                        type="text"
                        className="h-6 w-24 min-w-0 rounded-md border-0 bg-transparent px-0.5 text-xs text-gray-800 outline-none placeholder:text-fm-muted focus:ring-0"
                        placeholder="Seña $"
                        value={seniaMap[r.id] ?? ""}
                        onChange={(e) =>
                          setSeniaMap((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    title={waTitleMob}
                    disabled={!url}
                    className={cn(
                      "rounded-lg p-2",
                      url
                        ? "text-[#25D366] hover:bg-green-50"
                        : "cursor-not-allowed text-gray-300"
                    )}
                    onClick={() => {
                      if (url) window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <FaWhatsapp className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-fm-muted hover:bg-red-50 hover:text-red-600"
                    onClick={() => setConfirmDelete(r)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 font-semibold text-gray-800">{r.casas?.nombre ?? "—"}</p>
              <p className="mt-1 text-sm text-gray-800">
                {(r.nombre ?? "").trim()} {(r.apellido ?? "").trim()}{" "}
                <span className="text-fm-muted">· {r.email ?? "—"}</span>
              </p>
              <p className="mt-3 text-sm text-gray-800">
                📅 {formatFechaCorta(r.fecha_desde)} → {formatFechaCorta(r.fecha_hasta)}
              </p>
              <p className="mt-1 text-sm text-fm-muted">
                🌙 {r.noches ?? "—"} noches · 👥 {r.adultos}A {r.ninos}N · 🐾 {r.mascotas ?? 0}
              </p>
            </div>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-10 flex items-center justify-between">
          <Link
            href={`/admin/reservas?page=${Math.max(1, currentPage - 1)}`}
            className={cn(
              "rounded-lg border border-fm-border px-4 py-2 text-sm text-gray-800 hover:bg-gray-50",
              currentPage <= 1 && "pointer-events-none opacity-50"
            )}
          >
            Anterior
          </Link>
          <p className="text-sm text-fm-muted">
            Página {currentPage} de {totalPages}
          </p>
          <Link
            href={`/admin/reservas?page=${Math.min(totalPages, currentPage + 1)}`}
            className={cn(
              "rounded-lg border border-fm-border px-4 py-2 text-sm text-gray-800 hover:bg-gray-50",
              currentPage >= totalPages && "pointer-events-none opacity-50"
            )}
          >
            Siguiente
          </Link>
        </div>
      ) : null}

      <ReservaDetalle
        open={detalleOpen}
        reserva={detalle}
        whatsappE164={whatsappE164}
        whatsappMensaje={whatsappMensajeActivo}
        nombreComplejo={nombreComplejo}
        onClose={() => {
          setDetalleOpen(false);
          setDetalle(null);
        }}
      />
      <NuevaReservaModal open={nuevaOpen} onClose={() => setNuevaOpen(false)} casas={casasActivas} />

      <EditarMensajeWhatsappModal
        open={modalMensajeOpen}
        mensaje={mensajeEditado}
        onClose={() => {
          setModalMensajeOpen(false);
          setMensajeGuardadoOk(false);
        }}
        onChange={(val) => setMensajeEditado(val)}
        onRestaurar={() => setMensajeEditado(WHATSAPP_MENSAJE_DEFAULT)}
        onGuardar={handleGuardarMensaje}
        guardando={guardandoMensaje}
        guardadoOk={mensajeGuardadoOk}
      />

      <AnimateConfirmDelete
        reserva={confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await doDelete(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function AnimateConfirmDelete({
  reserva,
  onClose,
  onConfirm,
}: {
  reserva: ReservaAdmin | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {reserva ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
            aria-label="Cerrar"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal
          >
            <p className="text-lg font-semibold text-gray-800">¿Eliminar la reserva?</p>
            <p className="mt-2 text-sm text-fm-muted">
              ¿Eliminar la reserva de{" "}
              <span className="font-medium text-gray-800">
                {(reserva.nombre ?? "").trim()} {(reserva.apellido ?? "").trim()}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-fm-border px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

