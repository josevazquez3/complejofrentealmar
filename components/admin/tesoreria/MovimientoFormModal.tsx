"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import type { Casa, MetodoPago, TesoreriaCat, TesoreriaMovimiento, TipoMovimientoTes } from "@/types";
import { crearMovimiento, editarMovimiento, listarReservasPorCasa } from "@/app/admin/(panel)/tesoreria/actions";
import type { TesoreriaMovimientoInsert } from "@/lib/queries";

const METODOS: MetodoPago[] = ["efectivo", "transferencia", "tarjeta", "cheque", "otro"];

const NONE_CASA = "__none__";
const NONE_RESERVA = "";

export function MovimientoFormModal({
  open,
  onClose,
  casas,
  categorias,
  movimiento,
  defaultTipo,
}: {
  open: boolean;
  onClose: () => void;
  casas: Pick<Casa, "id" | "nombre">[];
  categorias: TesoreriaCat[];
  movimiento: TesoreriaMovimiento | null;
  defaultTipo?: TipoMovimientoTes;
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [tipo, setTipo] = useState<TipoMovimientoTes>("ingreso");
  const [fecha, setFecha] = useState("");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [casaId, setCasaId] = useState(NONE_CASA);
  const [reservaId, setReservaId] = useState(NONE_RESERVA);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("efectivo");
  const [comprobante, setComprobante] = useState("");
  const [notas, setNotas] = useState("");
  const [reservasOpts, setReservasOpts] = useState<{ id: string; nombre: string | null; apellido: string | null }[]>(
    []
  );

  useEffect(() => {
    if (!open) return;
    if (movimiento) {
      setTipo(movimiento.tipo);
      setFecha(movimiento.fecha.slice(0, 10));
      setConcepto(movimiento.concepto);
      setMonto(String(movimiento.monto));
      setCategoriaId(movimiento.categoria_id ?? "");
      setCasaId(movimiento.casa_id ?? NONE_CASA);
      setReservaId(movimiento.reserva_id ?? NONE_RESERVA);
      setMetodoPago(movimiento.metodo_pago);
      setComprobante(movimiento.comprobante ?? "");
      setNotas(movimiento.notas ?? "");
    } else {
      const hoy = new Date().toISOString().slice(0, 10);
      setTipo(defaultTipo ?? "ingreso");
      setFecha(hoy);
      setConcepto("");
      setMonto("");
      setCategoriaId("");
      setCasaId(NONE_CASA);
      setReservaId(NONE_RESERVA);
      setMetodoPago("efectivo");
      setComprobante("");
      setNotas("");
    }
  }, [open, movimiento, defaultTipo]);

  useEffect(() => {
    if (!open || !casaId || casaId === NONE_CASA) {
      setReservasOpts([]);
      if (casaId === NONE_CASA) setReservaId(NONE_RESERVA);
      return;
    }
    let cancelled = false;
    listarReservasPorCasa(casaId).then((res) => {
      if (cancelled) return;
      if (res.ok) setReservasOpts(res.rows);
      else setReservasOpts([]);
    });
    return () => {
      cancelled = true;
    };
  }, [open, casaId]);

  const catsFiltradas = categorias.filter((c) => c.tipo === tipo || c.tipo === "ambos");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = parseFloat(monto.replace(",", "."));
    if (!concepto.trim()) {
      showToast("El concepto es obligatorio.", "error");
      return;
    }
    if (!fecha || Number.isNaN(m) || m <= 0) {
      showToast("Monto y fecha válidos requeridos.", "error");
      return;
    }

    const payload: TesoreriaMovimientoInsert = {
      fecha,
      tipo,
      concepto: concepto.trim(),
      monto: m,
      metodo_pago: metodoPago,
      categoria_id: categoriaId || null,
      casa_id: casaId === NONE_CASA ? null : casaId,
      reserva_id: reservaId && reservaId !== NONE_RESERVA ? reservaId : null,
      comprobante: comprobante.trim() || null,
      notas: notas.trim() || null,
    };

    setPending(true);
    try {
      const res = movimiento
        ? await editarMovimiento(movimiento.id, payload)
        : await crearMovimiento(payload);
      if (res.ok) {
        showToast(movimiento ? "Movimiento actualizado." : "Movimiento registrado.", "success");
        router.refresh();
        onClose();
      } else showToast(res.error ?? "No se pudo guardar.", "error");
    } finally {
      setPending(false);
    }
  }

  const titulo = movimiento
    ? "Editar movimiento"
    : defaultTipo === "egreso"
      ? "Nuevo egreso"
      : defaultTipo === "ingreso"
        ? "Nuevo ingreso"
        : "Nuevo movimiento";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="movimiento-form"
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full max-w-lg max-h-[min(90dvh,42rem)] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
              role="dialog"
              aria-modal
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-800">{titulo}</h2>
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                  tipo === "ingreso" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                }`}
              >
                {tipo === "ingreso" ? "↑ Ingreso" : "↓ Egreso"}
              </span>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-fm-muted">Tipo *</p>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo("ingreso")}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                      tipo === "ingreso" ? "bg-green-600 text-white" : "border border-fm-border text-gray-700"
                    }`}
                  >
                    Ingreso ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo("egreso")}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                      tipo === "egreso" ? "bg-fm-red text-white" : "border border-fm-border text-gray-700"
                    }`}
                  >
                    Egreso ↓
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-fm-muted">Fecha *</label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Concepto *</label>
                <input
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Seña reserva Familia García"
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Monto *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fm-muted">$</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full rounded-lg border border-fm-border py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Categoría</label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                >
                  <option value="">— Sin categoría —</option>
                  {catsFiltradas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Unidad</label>
                <select
                  value={casaId}
                  onChange={(e) => {
                    setCasaId(e.target.value);
                    setReservaId(NONE_RESERVA);
                  }}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                >
                  <option value={NONE_CASA}>No aplica</option>
                  {casas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {casaId !== NONE_CASA ? (
                <div>
                  <label className="text-xs font-medium text-fm-muted">Reserva (opcional)</label>
                  <select
                    value={reservaId}
                    onChange={(e) => setReservaId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  >
                    <option value={NONE_RESERVA}>— Ninguna —</option>
                    {reservasOpts.map((r) => (
                      <option key={r.id} value={r.id}>
                        {(r.nombre ?? "").trim()} {(r.apellido ?? "").trim()}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div>
                <label className="text-xs font-medium text-fm-muted">Método de pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                >
                  {METODOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Comprobante</label>
                <input
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  placeholder="Nro. factura / recibo"
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-fm-muted">Notas</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                />
              </div>

              {movimiento?.reservas ? (
                <p className="text-xs text-fm-muted">
                  Reserva: {(movimiento.reservas.nombre ?? "").trim()}{" "}
                  {(movimiento.reservas.apellido ?? "").trim()}
                </p>
              ) : null}

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
                  className="rounded-lg bg-fm-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Guardar movimiento
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
