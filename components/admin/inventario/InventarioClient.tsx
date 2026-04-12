"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Home,
  Package,
  Pencil,
  Tags,
  Trash2,
  Warehouse,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { Casa, EstadoItem, InventarioCategoria, InventarioItem, InventarioStats } from "@/types";
import { formatFechaCorta } from "@/lib/format-fecha";
import { generarTemplateInventario } from "@/lib/inventario/generarTemplateInventario";
import { useCargaMasiva } from "@/hooks/inventario/useCargaMasiva";
import { ModalResultadoCarga } from "@/components/inventario/ModalResultadoCarga";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { darDeBajaItem, exportarInventarioItemsAccion } from "@/app/admin/(panel)/inventario/actions";
import { CategoriaInventarioIcon } from "./CategoriaInventarioIcon";
import { HistorialDrawer } from "./HistorialDrawer";
import { ItemFormModal } from "./ItemFormModal";
import { MoverStockModal } from "./MoverStockModal";

export type VistaInventario = "lista" | "unidad" | "stockbajo";

function exportarCSV(items: InventarioItem[]) {
  const headers = [
    "Nombre",
    "Unidad",
    "Categoría",
    "Cantidad",
    "Unidad medida",
    "Estado",
    "Ubicación",
    "Stock mínimo",
    "Última actualización",
  ];
  const rows = items.map((i) => [
    i.nombre,
    i.casas?.nombre ?? "",
    i.inventario_categorias?.nombre ?? "",
    i.cantidad,
    i.unidad,
    i.estado,
    i.ubicacion ?? "",
    i.cantidad_min,
    formatFechaCorta(new Date(i.updated_at).toISOString().slice(0, 10)),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventario-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function badgeEstado(estado: EstadoItem) {
  switch (estado) {
    case "bueno":
      return "bg-green-100 text-green-700";
    case "regular":
      return "bg-yellow-100 text-yellow-700";
    case "malo":
      return "bg-red-100 text-red-600";
    case "dado_de_baja":
      return "bg-gray-200 text-gray-500 line-through";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function labelEstado(estado: EstadoItem) {
  if (estado === "dado_de_baja") return "Baja";
  return estado;
}

function buildInventarioUrl(parts: {
  vista: VistaInventario;
  page?: number;
  casa?: string;
  categoria?: string;
  estado?: string;
  q?: string;
}) {
  const p = new URLSearchParams();
  p.set("vista", parts.vista);
  if (parts.page && parts.page > 1) p.set("page", String(parts.page));
  if (parts.casa) p.set("casa", parts.casa);
  if (parts.categoria) p.set("categoria", parts.categoria);
  if (parts.estado && parts.estado !== "todos") p.set("estado", parts.estado);
  if (parts.q?.trim()) p.set("q", parts.q.trim());
  const qs = p.toString();
  return qs ? `/admin/inventario?${qs}` : "/admin/inventario";
}

export function InventarioClient({
  items,
  totalCount,
  page,
  pageSize,
  stats,
  casas,
  categorias,
  vista,
  filters,
}: {
  items: InventarioItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  stats: InventarioStats;
  casas: Pick<Casa, "id" | "nombre">[];
  categorias: InventarioCategoria[];
  vista: VistaInventario;
  filters: { casaId?: string; categoriaId?: string; estado: string; q: string };
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [qInput, setQInput] = useState(filters.q);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventarioItem | null>(null);
  const [moverItem, setMoverItem] = useState<InventarioItem | null>(null);
  const [historialId, setHistorialId] = useState<string | null>(null);
  const [historialNombre, setHistorialNombre] = useState("");
  const [confirmBaja, setConfirmBaja] = useState<InventarioItem | null>(null);
  const [expandedCasas, setExpandedCasas] = useState<Set<string>>(() => new Set());
  const [exporting, setExporting] = useState(false);
  const inputCargaMasivaRef = useRef<HTMLInputElement>(null);
  const { ejecutarCarga, loading: cargaMasivaLoading, resultado, error: cargaMasivaError, resetear } =
    useCargaMasiva();

  useEffect(() => {
    setQInput(filters.q);
  }, [filters.q]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const showPagination = vista !== "unidad" && totalPages > 1;

  const byCasa = useMemo(() => {
    const map = new Map<string, InventarioItem[]>();
    items.forEach((i) => {
      const arr = map.get(i.casa_id) ?? [];
      arr.push(i);
      map.set(i.casa_id, arr);
    });
    return map;
  }, [items]);

  function toggleCasa(id: string) {
    setExpandedCasas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onExport() {
    setExporting(true);
    try {
      const res = await exportarInventarioItemsAccion();
      if (res.ok) {
        if (res.items.length) {
          exportarCSV(res.items);
          showToast("Archivo descargado.", "success");
        } else showToast("No hay artículos para exportar.", "error");
      } else showToast(res.error ?? "Error al exportar.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleCargaMasiva(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await ejecutarCarga(file);
    e.target.value = "";
  }

  async function doBaja() {
    if (!confirmBaja) return;
    const res = await darDeBajaItem(confirmBaja.id);
    if (res.ok) {
      showToast("Artículo dado de baja.", "success");
      setConfirmBaja(null);
      router.refresh();
    } else showToast(res.error ?? "No se pudo dar de baja.", "error");
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      buildInventarioUrl({
        vista,
        page: 1,
        casa: filters.casaId,
        categoria: filters.categoriaId,
        estado: filters.estado,
        q: qInput,
      })
    );
  }

  const listaRows = vista === "unidad" ? [] : items;
  const stockBajoEmpty = vista === "stockbajo" && listaRows.length === 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          <p className="mt-1 text-sm text-fm-muted">{stats.totalItems} artículos registrados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditItem(null);
              setFormOpen(true);
            }}
            className="rounded-lg bg-fm-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            + Nuevo artículo
          </button>
          <input
            ref={inputCargaMasivaRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleCargaMasiva}
          />
          <Button
            variant="outline"
            type="button"
            disabled={cargaMasivaLoading}
            onClick={() => inputCargaMasivaRef.current?.click()}
          >
            {cargaMasivaLoading ? "Importando..." : "📥 Carga masiva"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => {
              const blob = generarTemplateInventario();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "plantilla_inventario.xlsx";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            📄 Plantilla
          </Button>
          <Link
            href="/admin/inventario/categorias"
            className="inline-flex items-center gap-2 rounded-lg border border-fm-border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Tags className="h-4 w-4" />
            Categorías
          </Link>
          <button
            type="button"
            disabled={exporting}
            onClick={onExport}
            className="rounded-lg border border-fm-border px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="relative rounded-xl border border-fm-border bg-white p-5 shadow-sm">
          <Package className="absolute right-4 top-4 h-6 w-6 text-blue-700" />
          <p className="text-3xl font-bold text-blue-700">{stats.totalItems}</p>
          <p className="mt-1 text-sm text-fm-muted">Total artículos</p>
        </div>
        <div
          className={cn(
            "relative rounded-xl border border-fm-border bg-white p-5 shadow-sm",
            stats.itemsStockBajo > 0 && "border-yellow-400"
          )}
        >
          <AlertTriangle className="absolute right-4 top-4 h-6 w-6 text-yellow-700" />
          <p
            className={cn(
              "text-3xl font-bold text-yellow-800",
              stats.itemsStockBajo > 0 && "animate-pulse"
            )}
          >
            {stats.itemsStockBajo}
          </p>
          <p className="mt-1 text-sm text-fm-muted">Stock bajo</p>
        </div>
        <div
          className={cn(
            "relative rounded-xl border border-fm-border bg-white p-5 shadow-sm",
            stats.itemsMalEstado > 0 && "border-red-300"
          )}
        >
          <AlertCircle className="absolute right-4 top-4 h-6 w-6 text-red-600" />
          <p
            className={cn(
              "text-3xl font-bold text-red-700",
              stats.itemsMalEstado > 0 && "animate-pulse"
            )}
          >
            {stats.itemsMalEstado}
          </p>
          <p className="mt-1 text-sm text-fm-muted">Mal estado</p>
        </div>
        <div className="relative rounded-xl border border-fm-border bg-white p-5 shadow-sm">
          <Home className="absolute right-4 top-4 h-6 w-6 text-green-700" />
          <p className="text-3xl font-bold text-green-800">{stats.totalCasas}</p>
          <p className="mt-1 text-sm text-fm-muted">Casas cubiertas</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={buildInventarioUrl({
            vista: "lista",
            page: 1,
            casa: filters.casaId,
            categoria: filters.categoriaId,
            estado: filters.estado,
            q: filters.q,
          })}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            vista === "lista"
              ? "bg-fm-red text-white"
              : "border border-fm-border text-gray-700 hover:bg-gray-50"
          )}
        >
          <ClipboardList className="h-4 w-4" />
          Lista
        </Link>
        <Link
          href={buildInventarioUrl({
            vista: "unidad",
            casa: filters.casaId,
            categoria: filters.categoriaId,
            estado: filters.estado,
            q: filters.q,
          })}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            vista === "unidad"
              ? "bg-fm-red text-white"
              : "border border-fm-border text-gray-700 hover:bg-gray-50"
          )}
        >
          <Warehouse className="h-4 w-4" />
          Por unidad
        </Link>
        <Link
          href={buildInventarioUrl({ vista: "stockbajo", page: 1 })}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            vista === "stockbajo"
              ? "bg-fm-red text-white"
              : "border border-fm-border text-gray-700 hover:bg-gray-50"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          Stock bajo
        </Link>
      </div>

      {(vista === "lista" || vista === "stockbajo") && (
        <div className="mb-6 flex flex-col flex-wrap gap-3 lg:flex-row lg:items-center">
          <form onSubmit={applySearch} className="flex flex-wrap items-center gap-2">
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Buscar artículo..."
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
                buildInventarioUrl({
                  vista,
                  page: 1,
                  casa: e.target.value || undefined,
                  categoria: filters.categoriaId,
                  estado: filters.estado,
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
                buildInventarioUrl({
                  vista,
                  page: 1,
                  casa: filters.casaId,
                  categoria: e.target.value || undefined,
                  estado: filters.estado,
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
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["todos", "Todos"],
                ["bueno", "Bueno"],
                ["regular", "Regular"],
                ["malo", "Malo"],
                ["dado_de_baja", "Baja"],
              ] as const
            ).map(([val, label]) => {
              const active = filters.estado === val;
              return (
                <Link
                  key={val}
                  href={buildInventarioUrl({
                    vista,
                    page: 1,
                    casa: filters.casaId,
                    categoria: filters.categoriaId,
                    estado: val,
                    q: filters.q,
                  })}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    active ? "bg-fm-red text-white" : "border border-fm-border text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {stockBajoEmpty ? (
        <p className="py-12 text-center text-green-600">
          ✅ Todo el inventario tiene stock suficiente
        </p>
      ) : vista === "unidad" ? (
        <div className="space-y-2">
          {Array.from(byCasa.entries()).map(([casaId, rows]) => {
            const nombre = rows[0]?.casas?.nombre ?? "Sin unidad";
            const nBajo = rows.filter((r) => r.cantidad <= r.cantidad_min).length;
            const open = expandedCasas.has(casaId);
            return (
              <div key={casaId} className="overflow-hidden rounded-xl border border-fm-border bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleCasa(casaId)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2 font-medium text-gray-800">
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {nombre}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-fm-muted">
                    <span>{rows.length} artículos</span>
                    {nBajo > 0 ? (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 font-semibold text-yellow-800">
                        {nBajo} stock bajo
                      </span>
                    ) : null}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-fm-border"
                    >
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-left text-xs text-fm-muted">
                            <tr>
                              <th className="px-4 py-2">Nombre</th>
                              <th className="px-4 py-2">Cant.</th>
                              <th className="px-4 py-2">Estado</th>
                              <th className="px-4 py-2 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => (
                              <tr key={row.id} className="border-t border-fm-border">
                                <td className="px-4 py-2 font-medium text-gray-800">{row.nombre}</td>
                                <td className="px-4 py-2">{row.cantidad}</td>
                                <td className="px-4 py-2">
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                      badgeEstado(row.estado)
                                    )}
                                  >
                                    {labelEstado(row.estado)}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <AccionesItem
                                    onMover={() => setMoverItem(row)}
                                    onEdit={() => {
                                      setEditItem(row);
                                      setFormOpen(true);
                                    }}
                                    onHistorial={() => {
                                      setHistorialId(row.id);
                                      setHistorialNombre(row.nombre);
                                    }}
                                    onBaja={() => setConfirmBaja(row)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="space-y-2 p-3 md:hidden">
                        {rows.map((row) => (
                          <MobileItemCard
                            key={row.id}
                            row={row}
                            onMover={() => setMoverItem(row)}
                            onEdit={() => {
                              setEditItem(row);
                              setFormOpen(true);
                            }}
                            onHistorial={() => {
                              setHistorialId(row.id);
                              setHistorialNombre(row.nombre);
                            }}
                            onBaja={() => setConfirmBaja(row)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-fm-border bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-fm-border bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-fm-muted">Artículo</th>
                  <th className="px-4 py-3 font-medium text-fm-muted">Unidad</th>
                  <th className="px-4 py-3 font-medium text-fm-muted">Categoría</th>
                  <th className="px-4 py-3 font-medium text-fm-muted">Cantidad</th>
                  <th className="px-4 py-3 font-medium text-fm-muted">Estado</th>
                  <th className="px-4 py-3 font-medium text-fm-muted">Ubicación</th>
                  <th className="px-4 py-3 text-right font-medium text-fm-muted">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaRows.map((row) => (
                  <tr key={row.id} className="border-b border-fm-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{row.nombre}</p>
                      {row.descripcion ? (
                        <p className="mt-0.5 text-xs text-fm-muted">{row.descripcion}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {row.casas?.nombre ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm text-gray-700">
                        <CategoriaInventarioIcon icono={row.inventario_categorias?.icono} />
                        {row.inventario_categorias?.nombre ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <CantidadBadge item={row} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          badgeEstado(row.estado)
                        )}
                      >
                        {labelEstado(row.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-fm-muted">{row.ubicacion ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <AccionesItem
                        onMover={() => setMoverItem(row)}
                        onEdit={() => {
                          setEditItem(row);
                          setFormOpen(true);
                        }}
                        onHistorial={() => {
                          setHistorialId(row.id);
                          setHistorialNombre(row.nombre);
                        }}
                        onBaja={() => setConfirmBaja(row)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {listaRows.map((row) => (
              <MobileItemCard
                key={row.id}
                row={row}
                onMover={() => setMoverItem(row)}
                onEdit={() => {
                  setEditItem(row);
                  setFormOpen(true);
                }}
                onHistorial={() => {
                  setHistorialId(row.id);
                  setHistorialNombre(row.nombre);
                }}
                onBaja={() => setConfirmBaja(row)}
              />
            ))}
          </div>

          {showPagination ? (
            <div className="mt-8 flex items-center justify-between">
              <Link
                href={buildInventarioUrl({
                  vista,
                  page: Math.max(1, page - 1),
                  casa: filters.casaId,
                  categoria: filters.categoriaId,
                  estado: filters.estado,
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
                href={buildInventarioUrl({
                  vista,
                  page: Math.min(totalPages, page + 1),
                  casa: filters.casaId,
                  categoria: filters.categoriaId,
                  estado: filters.estado,
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
      )}

      <ItemFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditItem(null);
        }}
        casas={casas}
        categorias={categorias}
        item={editItem}
      />
      <MoverStockModal open={Boolean(moverItem)} onClose={() => setMoverItem(null)} item={moverItem} />
      <HistorialDrawer
        open={historialId !== null}
        onClose={() => setHistorialId(null)}
        itemId={historialId}
        nombreItem={historialNombre}
      />

      <ConfirmBajaModal item={confirmBaja} onClose={() => setConfirmBaja(null)} onConfirm={doBaja} />

      <ModalResultadoCarga
        open={Boolean(resultado || cargaMasivaError)}
        onClose={resetear}
        resultado={resultado}
        error={cargaMasivaError}
      />
    </div>
  );
}

function CantidadBadge({ item }: { item: InventarioItem }) {
  if (item.cantidad === 0) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">✗ Sin stock</span>
    );
  }
  if (item.cantidad <= item.cantidad_min) {
    return (
      <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
        ⚠ {item.cantidad} {item.unidad}
      </span>
    );
  }
  return (
    <span className="text-gray-800">
      {item.cantidad} <span className="text-fm-muted">{item.unidad}</span>
    </span>
  );
}

function AccionesItem({
  onMover,
  onEdit,
  onHistorial,
  onBaja,
}: {
  onMover: () => void;
  onEdit: () => void;
  onHistorial: () => void;
  onBaja: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <button
        type="button"
        onClick={onMover}
        className="rounded-lg p-2 text-fm-muted hover:bg-gray-100 hover:text-gray-800"
        title="Mover stock"
        aria-label="Mover stock"
      >
        <Package className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg p-2 text-fm-muted hover:bg-gray-100 hover:text-gray-800"
        title="Editar"
        aria-label="Editar"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onHistorial}
        className="rounded-lg p-2 text-fm-muted hover:bg-gray-100 hover:text-gray-800"
        title="Historial"
        aria-label="Historial"
      >
        <ClipboardList className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onBaja}
        className="rounded-lg p-2 text-fm-muted hover:bg-red-50 hover:text-red-600"
        title="Dar de baja"
        aria-label="Dar de baja"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function MobileItemCard({
  row,
  onMover,
  onEdit,
  onHistorial,
  onBaja,
}: {
  row: InventarioItem;
  onMover: () => void;
  onEdit: () => void;
  onHistorial: () => void;
  onBaja: () => void;
}) {
  return (
    <div className="rounded-xl border border-fm-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <CategoriaInventarioIcon icono={row.inventario_categorias?.icono} className="mt-0.5 h-5 w-5 text-gray-600" />
          <div className="min-w-0">
            <p className="font-medium text-gray-800">{row.nombre}</p>
            <p className="mt-0.5 text-xs text-fm-muted">
              {row.casas?.nombre ?? "—"}
              {row.ubicacion ? ` · ${row.ubicacion}` : ""}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            badgeEstado(row.estado)
          )}
        >
          {labelEstado(row.estado)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <CantidadBadge item={row} />
        <AccionesItem onMover={onMover} onEdit={onEdit} onHistorial={onHistorial} onBaja={onBaja} />
      </div>
    </div>
  );
}

function ConfirmBajaModal({
  item,
  onClose,
  onConfirm,
}: {
  item: InventarioItem | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {item ? (
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
            <p className="text-lg font-semibold text-gray-800">¿Dar de baja el artículo?</p>
            <p className="mt-2 text-sm text-fm-muted">
              <span className="font-medium text-gray-800">{item.nombre}</span> dejará de mostrarse en el inventario
              activo. Podés restaurarlo editando el ítem si en el futuro agregamos esa opción.
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
                Dar de baja
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
