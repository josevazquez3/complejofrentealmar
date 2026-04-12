"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/useToast";
import type { Casa, FechaBloqueada, ReservaInsert } from "@/types";
import { rangoSolapaBloqueados } from "@/lib/reservas-disponibilidad";
import { crearReservaAdmin } from "@/app/admin/(panel)/reservas/actions";

function ymdToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function NuevaReservaModal({
  open,
  onClose,
  casas,
}: {
  open: boolean;
  onClose: () => void;
  casas: Casa[];
}) {
  const { showToast } = useToast();
  const [casaId, setCasaId] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [adultos, setAdultos] = useState(1);
  const [ninos, setNinos] = useState(0);
  const [mascotas, setMascotas] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [bloqueadas, setBloqueadas] = useState<FechaBloqueada[]>([]);

  const casa = useMemo(() => casas.find((c) => c.id === casaId) ?? null, [casas, casaId]);
  const capHuespedes = casa?.capacidad_personas ?? 0;
  const maxAdultosOpcion = Math.min(10, Math.max(1, capHuespedes));
  const maxNinosOpcion = Math.min(10, Math.max(0, capHuespedes - adultos));

  useEffect(() => {
    if (!open) return;
    setCasaId(casas[0]?.id ?? "");
  }, [open, casas]);

  useEffect(() => {
    if (!casaId) {
      setBloqueadas([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/disponibilidad?casaId=${encodeURIComponent(casaId)}`)
      .then((r) => (r.ok ? (r.json() as Promise<FechaBloqueada[]>) : []))
      .then((d) => {
        if (!cancelled) setBloqueadas(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        if (!cancelled) setBloqueadas([]);
      });
    return () => {
      cancelled = true;
    };
  }, [casaId]);

  useEffect(() => {
    if (!casa) return;
    const cap = casa.capacidad_personas;
    setAdultos((aPrev) => {
      const a = Math.min(Math.max(1, aPrev), Math.min(10, cap));
      setNinos((nPrev) => Math.min(Math.max(0, nPrev), Math.max(0, cap - a)));
      return a;
    });
  }, [casa]);

  function validate(): string | null {
    if (!casaId) return "Elegí una unidad.";
    if (!fechaDesde || !fechaHasta) return "Completá las fechas.";
    if (fechaHasta <= fechaDesde) return "La fecha hasta debe ser posterior a la fecha desde.";
    if (fechaDesde < ymdToday()) return "La fecha desde no puede ser anterior a hoy.";
    if (!nombre.trim() || !apellido.trim()) return "Completá nombre y apellido.";
    if (!email.trim() || !telefono.trim()) return "Completá email y teléfono.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Email inválido.";
    if (!Number.isFinite(adultos) || adultos < 1 || adultos > 10) return "Adultos inválido (1 a 10).";
    if (!Number.isFinite(ninos) || ninos < 0 || ninos > 10) return "Niños inválido (0 a 10).";
    if (!Number.isFinite(mascotas) || mascotas < 0 || mascotas > 5) return "Mascotas inválido (0 a 5).";
    if (casa && adultos + ninos > casa.capacidad_personas) {
      return `Máximo ${casa.capacidad_personas} personas (adultos + niños).`;
    }
    if (rangoSolapaBloqueados(fechaDesde, fechaHasta, bloqueadas)) return "Esas fechas ya están ocupadas.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      showToast(msg, "error");
      return;
    }
    setLoading(true);
    const payload: ReservaInsert = {
      casa_id: casaId,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      adultos,
      ninos,
      mascotas,
      mensaje: mensaje.trim() || undefined,
    };
    const res = await crearReservaAdmin(payload);
    setLoading(false);
    if (res.ok) {
      showToast("Reserva confirmada creada.", "success");
      onClose();
      setFechaDesde("");
      setFechaHasta("");
      setNombre("");
      setApellido("");
      setEmail("");
      setTelefono("");
      setAdultos(1);
      setNinos(0);
      setMascotas(0);
      setMensaje("");
    } else {
      showToast(res.error ?? "No se pudo crear.", "error");
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="nueva-reserva"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60"
            onClick={onClose}
            aria-label="Cerrar"
          />
          <div className="relative flex min-h-[100dvh] items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full max-w-[min(96vw,32rem)] max-h-[min(92dvh,48rem)] overflow-y-auto rounded-2xl bg-white shadow-xl"
              role="dialog"
              aria-modal
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between border-b border-fm-border p-5">
              <p className="font-semibold text-gray-800">Nueva Reserva</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Unidad *</label>
                <select
                  value={casaId}
                  onChange={(e) => setCasaId(e.target.value)}
                  className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                >
                  {casas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fecha desde *</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                    min={ymdToday()}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fecha hasta *</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                    min={fechaDesde || ymdToday()}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Apellido *</label>
                  <input
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono *</label>
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad de Adultos *</label>
                  <select
                    value={adultos}
                    onChange={(e) => {
                      const a = Number(e.target.value);
                      setAdultos(a);
                      setNinos((n) => Math.min(n, Math.max(0, capHuespedes - a)));
                    }}
                    className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  >
                    {Array.from({ length: maxAdultosOpcion }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad de Niños</label>
                  <select
                    value={ninos}
                    onChange={(e) => setNinos(Number(e.target.value))}
                    className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                  >
                    {Array.from({ length: maxNinosOpcion + 1 }, (_, i) => i).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="sm:w-1/2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad de Mascotas</label>
                <select
                  value={mascotas}
                  onChange={(e) => setMascotas(Number(e.target.value))}
                  className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                >
                  {Array.from({ length: 6 }, (_, i) => i).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mensaje</label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-fm-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fm-red"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-fm-red py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:opacity-70"
              >
                {loading ? "Enviando..." : "Crear reserva confirmada"}
              </button>
            </form>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

