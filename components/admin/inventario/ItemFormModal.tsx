"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import type { Casa, EstadoItem, InventarioCategoria, InventarioItem, UnidadItem } from "@/types";
import { crearItem, editarItem } from "@/app/admin/(panel)/inventario/actions";
import { useRouter } from "next/navigation";

const UNIDADES: UnidadItem[] = ["unidad", "juego", "par", "set", "rollo", "litro"];
const ESTADOS_NUEVO: Exclude<EstadoItem, "dado_de_baja">[] = ["bueno", "regular", "malo"];
const ESTADOS_EDIT: EstadoItem[] = ["bueno", "regular", "malo", "dado_de_baja"];

export function ItemFormModal({
  open,
  onClose,
  casas,
  categorias,
  item,
}: {
  open: boolean;
  onClose: () => void;
  casas: Pick<Casa, "id" | "nombre">[];
  categorias: InventarioCategoria[];
  item: InventarioItem | null;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [casaId, setCasaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [cantidadMin, setCantidadMin] = useState(1);
  const [unidadMedida, setUnidadMedida] = useState<UnidadItem>("unidad");
  const [estado, setEstado] = useState<EstadoItem>("bueno");
  const [ubicacion, setUbicacion] = useState("");

  useEffect(() => {
    if (!open) return;
    if (item) {
      setCasaId(item.casa_id);
      setCategoriaId(item.categoria_id ?? "");
      setNombre(item.nombre);
      setDescripcion(item.descripcion ?? "");
      setCantidad(item.cantidad);
      setCantidadMin(item.cantidad_min);
      setUnidadMedida(item.unidad);
      setEstado(item.estado);
      setUbicacion(item.ubicacion ?? "");
    } else {
      setCasaId(casas[0]?.id ?? "");
      setCategoriaId("");
      setNombre("");
      setDescripcion("");
      setCantidad(1);
      setCantidadMin(1);
      setUnidadMedida("unidad");
      setEstado("bueno");
      setUbicacion("");
    }
  }, [open, item, casas]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!casaId || !nombre.trim()) {
      showToast("Completá unidad y nombre.", "error");
      return;
    }
    setPending(true);
    try {
      const payload = {
        casa_id: casaId,
        categoria_id: categoriaId || null,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        cantidad: Math.max(0, cantidad),
        cantidad_min: Math.max(0, cantidadMin),
        unidad: unidadMedida,
        estado,
        ubicacion: ubicacion.trim() || null,
        activo: true,
      };
      const res = item ? await editarItem(item.id, payload) : await crearItem(payload);
      if (res.ok) {
        showToast(item ? "Artículo actualizado." : "Artículo creado.", "success");
        router.refresh();
        onClose();
      } else showToast(res.error ?? "No se pudo guardar.", "error");
    } finally {
      setPending(false);
    }
  }

  const estados = item ? ESTADOS_EDIT : ESTADOS_NUEVO;

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
            className="fixed inset-0 z-50 bg-black/60 sm:bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 48, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-[6vh] sm:bottom-auto sm:max-h-[min(88vh,40rem)] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:translate-y-0 sm:rounded-2xl"
            role="dialog"
            aria-modal
          >
            <h2 className="text-lg font-semibold text-gray-800">
              {item ? "Editar artículo" : "Nuevo artículo"}
            </h2>
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-fm-muted">Unidad *</label>
                <select
                  required
                  value={casaId}
                  onChange={(e) => setCasaId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                >
                  {casas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Categoría</label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                >
                  <option value="">— Sin categoría —</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Nombre *</label>
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-fm-muted">Cantidad *</label>
                  <input
                    type="number"
                    min={0}
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-fm-muted" title="Alerta si el stock baja de este valor">
                    Cantidad mín. *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={cantidadMin}
                    onChange={(e) => setCantidadMin(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-fm-muted">Unidad medida</label>
                  <select
                    value={unidadMedida}
                    onChange={(e) => setUnidadMedida(e.target.value as UnidadItem)}
                    className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  >
                    {UNIDADES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-fm-muted">Estado</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoItem)}
                    className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  >
                    {estados.map((s) => (
                      <option key={s} value={s}>
                        {s === "dado_de_baja" ? "Dado de baja" : s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Ubicación</label>
                <input
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ej: Cocina"
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-fm-border px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-fm-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </form>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
