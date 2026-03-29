"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList,
  List,
  Pencil,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { Casa, MetodoPago, TesoreriaCat, TesoreriaMovimiento, TesoreriaStats, TipoMovimientoTes } from "@/types";
import { formatFechaCorta } from "@/lib/format-fecha";
import { formatMonto, formatMontoConSigno } from "@/lib/format-moneda";
import { cn } from "@/lib/utils";
import { eliminarMovimiento, exportarTesoreriaMovimientosAccion } from "@/app/admin/(panel)/tesoreria/actions";
import { CategoriaTesoreriaIcon } from "./CategoriaTesoreriaIcon";
import { MovimientoFormModal } from "./MovimientoFormModal";
import { ResumenTesoreria } from "./ResumenTesoreria";

export type TabTesoreria = "todos" | "ingresos" | "egresos" | "resumen";

const METODOS: MetodoPago[] = ["efectivo", "transferencia", "tarjeta", "cheque", "otro"];

function exportarCSV(movimientos: TesoreriaMovimiento[]) {
  const headers = [
    "Fecha",
    "Tipo",
    "Concepto",
    "Categoría",
    "Unidad",
    "Monto",
    "Método de pago",
    "Comprobante",
    "Notas",
  ];
  const rows = movimientos.map((m) => [
    m.fecha,
    m.tipo,
    m.concepto,
    m.tesoreria_categorias?.nombre ?? "",
    m.casas?.nombre ?? "",
    m.tipo === "ingreso" ? m.monto : -m.monto,
    m.metodo_pago,
    m.comprobante ?? "",
    m.notas ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tesoreria-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildUrl(parts: {
  tab: TabTesoreria;
  page?: number;
  casa?: string;
  categoria?: string;
  metodo?: string;
  desde?: string;
  hasta?: string;
  q?: string;
}) {
  const p = new URLSearchParams();
  if (parts.tab !== "todos") p.set("tab", parts.tab);
  if (parts.page && parts.page > 1) p.set("page", String(parts.page));
  if (parts.casa) p.set("casa", parts.casa);
  if (parts.categoria) p.set("categoria", parts.categoria);
  if (parts.metodo) p.set("metodo", parts.metodo);
  if (parts.desde) p.set("desde", parts.desde);
  if (parts.hasta) p.set("hasta", parts.hasta);
  if (parts.q?.trim()) p.set("q", parts.q.trim());
  const qs = p.toString();
  return qs ? `/admin/tesoreria?${qs}` : "/admin/tesoreria";
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inicioFinMes(offset: number): { desde: string; hasta: string } {
  const ref = new Date();
  ref.setMonth(ref.getMonth() + offset);
  const desde = ymd(new Date(ref.getFullYear(), ref.getMonth(), 1));
  const hasta = ymd(new Date(ref.getFullYear(), ref.getMonth() + 1, 0));
  return { desde, hasta };
}

export function TesoreriaClient({
  movimientos,
  totalCount,
  page,
  pageSize,
  stats,
  casas,
  categorias,
  movimientosResumen,
  tab,
  filters,
}: {
  movimientos: TesoreriaMovimiento[];
  totalCount: number;
  page: number;
  pageSize: number;
  stats: TesoreriaStats;
  casas: Pick<Casa, "id" | "nombre">[];
  categorias: TesoreriaCat[];
  movimientosResumen: TesoreriaMovimiento[];
  tab: TabTesoreria;
  filters: {
    casaId?: string;
    categoriaId?: string;
    metodoPago?: MetodoPago;
    desde?: string;
    hasta?: string;
    q: string;
  };
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [qInput, setQInput] = useState(filters.q);
  const [formOpen, setFormOpen] = useState(false);
  const [formTipo, setFormTipo] = useState<TipoMovimientoTes | undefined>(undefined);
  const [editMov, setEditMov] = useState<TesoreriaMovimiento | null>(null);
  const [confirmDel, setConfirmDel] = useState<TesoreriaMovimiento | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setQInput(filters.q);
  }, [filters.q]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const showTable = tab !== "resumen";

  const totalesPagina = useMemo(() => {
    let ing = 0;
    let egr = 0;
    movimientos.forEach((m) => {
      if (m.tipo === "ingreso") ing += m.monto;
      else egr += m.monto;
    });
    return { ing, egr, bal: ing - egr };
  }, [movimientos]);

  async function onExport() {
    setExporting(true);
    try {
      const tipoEff =
        tab === "ingresos" ? ("ingreso" as const) : tab === "egresos" ? ("egreso" as const) : undefined;
      const res = await exportarTesoreriaMovimientosAccion({
        tipo: tipoEff,
        casaId: filters.casaId,
        categoriaId: filters.categoriaId,
        metodoPago: filters.metodoPago,
        fechaDesde: filters.desde,
        fechaHasta: filters.hasta,
        busqueda: filters.q,
      });
      if (res.ok) {
        if (res.items.length) {
          exportarCSV(res.items);
          showToast("Archivo descargado.", "success");
        } else showToast("No hay movimientos para exportar.", "error");
      } else showToast(res.error ?? "Error al exportar.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function doDelete() {
    if (!confirmDel) return;
    const r = await eliminarMovimiento(confirmDel.id);
    if (r.ok) {
      showToast("Movimiento eliminado.", "success");
      setConfirmDel(null);
      router.refresh();
    } else showToast(r.error ?? "No se pudo eliminar.", "error");
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      buildUrl({
        tab,
        page: 1,
        casa: filters.casaId,
        categoria: filters.categoriaId,
        metodo: filters.metodoPago,
        desde: filters.desde,
        hasta: filters.hasta,
        q: qInput,
      })
    );
  }

  const balanceOk = stats.balance >= 0;
  const balanceMesOk = stats.balanceMes >= 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tesorería</h1>
          <p className="mt-1 text-sm text-fm-muted">{stats.cantMovimientos} movimientos registrados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditMov(null);
              setFormTipo("ingreso");
              setFormOpen(true);
            }}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            + Ingreso
          </button>
          <button
            type="button"
            onClick={() => {
              setEditMov(null);
              setFormTipo("egreso");
              setFormOpen(true);
            }}
            className="rounded-lg bg-fm-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            + Egreso
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={onExport}
            className="rounded-lg border border-fm-border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Exportar
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
          className={cn(
            "rounded-xl border p-5 shadow-sm",
            balanceOk ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"
          )}
        >
          <Scale className="mb-2 h-6 w-6 opacity-80" />
          <p className="text-3xl font-bold">{formatMonto(stats.balance)}</p>
          <p className="mt-1 text-sm opacity-90">Balance general</p>
        </div>
        <div className="rounded-xl border border-fm-border bg-white p-5 shadow-sm">
          <TrendingUp className="mb-2 h-6 w-6 text-green-700" />
          <p className="text-3xl font-bold text-green-700">{formatMonto(stats.totalIngresos)}</p>
          <p className="mt-1 text-sm text-fm-muted">Total ingresos</p>
        </div>
        <div className="rounded-xl border border-fm-border bg-white p-5 shadow-sm">
          <TrendingDown className="mb-2 h-6 w-6 text-red-600" />
          <p className="text-3xl font-bold text-red-600">{formatMonto(stats.totalEgresos)}</p>
          <p className="mt-1 text-sm text-fm-muted">Total egresos</p>
        </div>
        <div className="rounded-xl border border-fm-border bg-white p-5 shadow-sm">
          <List className="mb-2 h-6 w-6 text-blue-700" />
          <p className="text-3xl font-bold text-blue-700">{stats.cantMovimientos}</p>
          <p className="mt-1 text-sm text-fm-muted">Movimientos</p>
        </div>
      </div>

      <p className="mb-2 text-sm font-medium text-fm-muted">Este mes</p>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-fm-border bg-green-50/80 p-4">
          <p className="text-xs text-fm-muted">Ingresos</p>
          <p className="text-xl font-bold text-green-700">{formatMonto(stats.ingresosMes)}</p>
        </div>
        <div className="rounded-xl border border-fm-border bg-red-50/80 p-4">
          <p className="text-xs text-fm-muted">Egresos</p>
          <p className="text-xl font-bold text-red-600">{formatMonto(stats.egresosMes)}</p>
        </div>
        <div
          className={cn(
            "rounded-xl border p-4",
            balanceMesOk ? "border-green-200 bg-green-50/50 text-green-700" : "border-red-200 bg-red-50/50 text-red-600"
          )}
        >
          <p className="text-xs opacity-80">Balance</p>
          <p className="text-xl font-bold">{formatMonto(stats.balanceMes)}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["todos", "Todos", ClipboardList],
            ["ingresos", "Ingresos", TrendingUp],
            ["egresos", "Egresos", TrendingDown],
            ["resumen", "Resumen", List],
          ] as const
        ).map(([t, label, Icon]) => (
          <Link
            key={t}
            href={buildUrl({
              tab: t,
              page: 1,
              casa: filters.casaId,
              categoria: filters.categoriaId,
              metodo: filters.metodoPago,
              desde: filters.desde,
              hasta: filters.hasta,
              q: filters.q,
            })}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t ? "bg-fm-red text-white" : "border border-fm-border text-gray-700 hover:bg-gray-50"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {showTable ? (
        <>
          <div className="mb-6 flex flex-col flex-wrap gap-3 lg:flex-row lg:items-end">
            <form onSubmit={applySearch} className="flex flex-wrap items-center gap-2">
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Buscar concepto..."
                className="w-56 rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
              />
              <button
                type="submit"
                className="rounded-lg border border-fm-border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Buscar
              </button>
            </form>
            <select
              value={filters.casaId ?? ""}
              onChange={(e) =>
                router.push(
                  buildUrl({
                    tab,
                    page: 1,
                    casa: e.target.value || undefined,
                    categoria: filters.categoriaId,
                    metodo: filters.metodoPago,
                    desde: filters.desde,
                    hasta: filters.hasta,
                    q: filters.q,
                  })
                )
              }
              className="rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
            >
              <option value="">Todas las unidades</option>
              {casas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              value={filters.categoriaId ?? ""}
              onChange={(e) =>
                router.push(
                  buildUrl({
                    tab,
                    page: 1,
                    casa: filters.casaId,
                    categoria: e.target.value || undefined,
                    metodo: filters.metodoPago,
                    desde: filters.desde,
                    hasta: filters.hasta,
                    q: filters.q,
                  })
                )
              }
              className="rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              value={filters.metodoPago ?? ""}
              onChange={(e) =>
                router.push(
                  buildUrl({
                    tab,
                    page: 1,
                    casa: filters.casaId,
                    categoria: filters.categoriaId,
                    metodo: (e.target.value || undefined) as MetodoPago | undefined,
                    desde: filters.desde,
                    hasta: filters.hasta,
                    q: filters.q,
                  })
                )
              }
              className="rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
            >
              <option value="">Todos los métodos</option>
              {METODOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.desde ?? ""}
              onChange={(e) =>
                router.push(
                  buildUrl({
                    tab,
                    page: 1,
                    casa: filters.casaId,
                    categoria: filters.categoriaId,
                    metodo: filters.metodoPago,
                    desde: e.target.value || undefined,
                    hasta: filters.hasta,
                    q: filters.q,
                  })
                )
              }
              className="rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
            />
            <input
              type="date"
              value={filters.hasta ?? ""}
              onChange={(e) =>
                router.push(
                  buildUrl({
                    tab,
                    page: 1,
                    casa: filters.casaId,
                    categoria: filters.categoriaId,
                    metodo: filters.metodoPago,
                    desde: filters.desde,
                    hasta: e.target.value || undefined,
                    q: filters.q,
                  })
                )
              }
              className="rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const { desde, hasta } = inicioFinMes(0);
                  router.push(
                    buildUrl({
                      tab,
                      page: 1,
                      casa: filters.casaId,
                      categoria: filters.categoriaId,
                      metodo: filters.metodoPago,
                      desde,
                      hasta,
                      q: filters.q,
                    })
                  );
                }}
                className="rounded-lg border border-fm-border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Este mes
              </button>
              <button
                type="button"
                onClick={() => {
                  const { desde, hasta } = inicioFinMes(-1);
                  router.push(
                    buildUrl({
                      tab,
                      page: 1,
                      casa: filters.casaId,
                      categoria: filters.categoriaId,
                      metodo: filters.metodoPago,
                      desde,
                      hasta,
                      q: filters.q,
                    })
                  );
                }}
                className="rounded-lg border border-fm-border px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Mes anterior
              </button>
            </div>
            <Link
              href={tab === "todos" ? "/admin/tesoreria" : `/admin/tesoreria?tab=${tab}`}
              className="text-sm text-fm-muted underline-offset-2 hover:underline"
            >
              Limpiar filtros
            </Link>
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-fm-border bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-fm-border bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-fm-muted">Fecha</th>
                  <th className="px-4 py-3 font-medium text-fm-muted">Tipo</th>
                  <th className="px-4 py-3 font-medium text-fm-muted">Concepto</th>
                  <th className="px-4 py-3 font-medium text-fm-muted">Categoría</th>
                  <th className="px-4 py-3 font-medium text-fm-muted">Unidad</th>
                  <th className="px-4 py-3 text-right font-medium text-fm-muted">Monto</th>
                  <th className="px-4 py-3 font-medium text-fm-muted">Método</th>
                  <th className="px-4 py-3 text-right font-medium text-fm-muted">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((row) => (
                  <tr key={row.id} className="border-b border-fm-border transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-fm-muted">{formatFechaCorta(row.fecha.slice(0, 10))}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                          row.tipo === "ingreso" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        )}
                      >
                        {row.tipo === "ingreso" ? "↑ Ingreso" : "↓ Egreso"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{row.concepto}</p>
                      {row.comprobante ? (
                        <p className="text-xs text-fm-muted">{row.comprobante}</p>
                      ) : null}
                      {row.reservas ? (
                        <p className="text-xs text-fm-muted">
                          Reserva: {(row.reservas.nombre ?? "").trim()} {(row.reservas.apellido ?? "").trim()}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <CategoriaTesoreriaIcon icono={row.tesoreria_categorias?.icono} />
                        {row.tesoreria_categorias?.nombre ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fm-muted">{row.casas?.nombre ?? "—"}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold",
                        row.tipo === "ingreso" ? "text-green-700" : "text-red-600"
                      )}
                    >
                      {formatMontoConSigno(row.monto, row.tipo)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {row.metodo_pago}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditMov(row);
                          setFormTipo(undefined);
                          setFormOpen(true);
                        }}
                        className="mr-1 rounded-lg p-2 text-fm-muted hover:bg-gray-100"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDel(row)}
                        className="rounded-lg p-2 text-fm-muted hover:bg-red-50 hover:text-red-600"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium">
                  <td colSpan={5} className="px-4 py-3 text-fm-muted">
                    Totales (página)
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="block text-green-700">{formatMonto(totalesPagina.ing)}</span>
                    <span className="block text-red-600">{formatMonto(totalesPagina.egr)}</span>
                    <span className={cn("block pt-1 font-semibold", totalesPagina.bal >= 0 ? "text-green-700" : "text-red-600")}>
                      {formatMonto(totalesPagina.bal)}
                    </span>
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {movimientos.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-fm-border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      row.tipo === "ingreso" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    )}
                  >
                    {row.tipo === "ingreso" ? "↑ Ingreso" : "↓ Egreso"}
                  </span>
                  <p
                    className={cn(
                      "text-right font-semibold",
                      row.tipo === "ingreso" ? "text-green-700" : "text-red-600"
                    )}
                  >
                    {formatMontoConSigno(row.monto, row.tipo)}
                  </p>
                </div>
                <p className="mt-2 font-medium text-gray-800">{row.concepto}</p>
                <p className="mt-1 text-xs text-fm-muted">
                  {row.tesoreria_categorias?.nombre ?? "—"} · {row.casas?.nombre ?? "—"}
                </p>
                <p className="mt-1 text-xs text-fm-muted">
                  {formatFechaCorta(row.fecha.slice(0, 10))} · {row.metodo_pago}
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditMov(row);
                      setFormTipo(undefined);
                      setFormOpen(true);
                    }}
                    className="rounded-lg border border-fm-border px-3 py-1.5 text-xs text-gray-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(row)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-between">
              <Link
                href={buildUrl({
                  tab,
                  page: Math.max(1, page - 1),
                  casa: filters.casaId,
                  categoria: filters.categoriaId,
                  metodo: filters.metodoPago,
                  desde: filters.desde,
                  hasta: filters.hasta,
                  q: filters.q,
                })}
                className={cn(
                  "rounded-lg border border-fm-border px-4 py-2 text-sm text-gray-800 hover:bg-gray-50",
                  page <= 1 && "pointer-events-none opacity-50"
                )}
              >
                Anterior
              </Link>
              <p className="text-sm text-fm-muted">
                Página {page} de {totalPages}
              </p>
              <Link
                href={buildUrl({
                  tab,
                  page: Math.min(totalPages, page + 1),
                  casa: filters.casaId,
                  categoria: filters.categoriaId,
                  metodo: filters.metodoPago,
                  desde: filters.desde,
                  hasta: filters.hasta,
                  q: filters.q,
                })}
                className={cn(
                  "rounded-lg border border-fm-border px-4 py-2 text-sm text-gray-800 hover:bg-gray-50",
                  page >= totalPages && "pointer-events-none opacity-50"
                )}
              >
                Siguiente
              </Link>
            </div>
          ) : null}
        </>
      ) : (
        <ResumenTesoreria movimientos={movimientosResumen} />
      )}

      <MovimientoFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditMov(null);
          setFormTipo(undefined);
        }}
        casas={casas}
        categorias={categorias}
        movimiento={editMov}
        defaultTipo={editMov ? undefined : formTipo}
      />

      <ConfirmDeleteModal mov={confirmDel} onClose={() => setConfirmDel(null)} onConfirm={doDelete} />
    </div>
  );
}

function ConfirmDeleteModal({
  mov,
  onClose,
  onConfirm,
}: {
  mov: TesoreriaMovimiento | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {mov ? (
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
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal
          >
            <p className="text-lg font-semibold text-gray-800">¿Eliminar movimiento?</p>
            <p className="mt-2 text-sm text-fm-muted">
              ¿Eliminar el movimiento &quot;{mov.concepto}&quot;? Esta acción no se puede deshacer.
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
                className="rounded-lg bg-fm-red px-4 py-2 text-sm font-bold uppercase text-white hover:bg-red-700"
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
