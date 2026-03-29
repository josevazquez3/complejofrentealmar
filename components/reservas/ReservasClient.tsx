"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Users } from "lucide-react";
import { crearReserva } from "@/app/actions/reservas";
import { FadeInSection } from "@/components/home/FadeInSection";
import { Calendario } from "@/components/reservas/Calendario";
import { formatFechaAR, parseYmdLocal, toYmdLocal } from "@/lib/date-ymd";
import { rangoSolapaBloqueados } from "@/lib/reservas-disponibilidad";
import { BLUR_DATA_URL } from "@/lib/blur-placeholder";
import { useToast } from "@/hooks/useToast";
import type { Casa, FechaBloqueada } from "@/types";
import { cn } from "@/lib/utils";

function nochesEntre(desdeYmd: string, hastaYmd: string): number {
  const d1 = parseYmdLocal(desdeYmd);
  const d2 = parseYmdLocal(hastaYmd);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

function formatPrecio(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function descripcionUnaLinea(casa: Casa): string {
  const c = casa.descripcion_corta?.trim();
  if (c) return c;
  const d = casa.descripcion?.trim();
  if (!d) return "";
  const line = d.split(/\r?\n/)[0] ?? "";
  return line.length > 90 ? `${line.slice(0, 90)}…` : line;
}

export function ReservasClient({ casas }: { casas: Casa[] }) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [casaId, setCasaId] = useState<string | null>(null);
  const [mesActual, setMesActual] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [fechasBloqueadas, setFechasBloqueadas] = useState<FechaBloqueada[]>([]);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [personas, setPersonas] = useState(1);
  const [mensaje, setMensaje] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const casaSeleccionada = useMemo(
    () => (casaId ? casas.find((c) => c.id === casaId) ?? null : null),
    [casas, casaId]
  );

  useEffect(() => {
    const param = searchParams.get("casaId");
    if (!param || !casas.some((c) => c.id === param)) return;
    setCasaId(param);
  }, [searchParams, casas]);

  useEffect(() => {
    if (!casaId) {
      setFechasBloqueadas([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/disponibilidad?casaId=${encodeURIComponent(casaId)}`)
      .then((r) => {
        if (!r.ok) return [];
        return r.json() as Promise<FechaBloqueada[]>;
      })
      .then((data) => {
        if (!cancelled) setFechasBloqueadas(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setFechasBloqueadas([]);
      });
    return () => {
      cancelled = true;
    };
  }, [casaId]);

  useEffect(() => {
    if (casaSeleccionada) {
      setPersonas((p) => Math.min(p, casaSeleccionada.capacidad_personas));
    }
  }, [casaSeleccionada]);

  const handleSelectFecha = useCallback(
    (d: Date) => {
      const ymd = toYmdLocal(d);
      if (!fechaDesde || (fechaDesde && fechaHasta)) {
        setFechaDesde(d);
        setFechaHasta(null);
        return;
      }
      const desdeYmd = toYmdLocal(fechaDesde);
      if (ymd <= desdeYmd) {
        setFechaDesde(d);
        setFechaHasta(null);
        return;
      }
      if (rangoSolapaBloqueados(desdeYmd, ymd, fechasBloqueadas)) {
        showToast("El rango incluye fechas no disponibles.", "error");
        setFechaDesde(null);
        setFechaHasta(null);
        return;
      }
      setFechaHasta(d);
    },
    [fechaDesde, fechaHasta, fechasBloqueadas, showToast]
  );

  const desdeYmd = fechaDesde ? toYmdLocal(fechaDesde) : null;
  const hastaYmd = fechaHasta ? toYmdLocal(fechaHasta) : null;
  const noches =
    desdeYmd && hastaYmd && hastaYmd > desdeYmd ? nochesEntre(desdeYmd, hastaYmd) : 0;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "Requerido";
    if (!apellido.trim()) e.apellido = "Requerido";
    if (!email.trim()) e.email = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Email inválido";
    if (!telefono.trim()) e.telefono = "Requerido";
    if (!personas || personas < 1) e.personas = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!casaId || !desdeYmd || !hastaYmd) return;
    if (!validate()) return;
    setLoading(true);
    const res = await crearReserva({
      casa_id: casaId,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      fecha_desde: desdeYmd,
      fecha_hasta: hastaYmd,
      personas,
      mensaje: mensaje.trim() || undefined,
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      showToast(res.error ?? "Error al enviar", "error");
    }
  }

  function resetTodo() {
    setCasaId(null);
    setFechaDesde(null);
    setFechaHasta(null);
    setNombre("");
    setApellido("");
    setEmail("");
    setTelefono("");
    setPersonas(1);
    setMensaje("");
    setErrors({});
    setSuccess(false);
    const d = new Date();
    setMesActual(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  if (success && casaSeleccionada && desdeYmd && hastaYmd) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-600" aria-hidden />
        <h2 className="mt-6 text-2xl font-bold text-gray-800">¡Solicitud enviada!</h2>
        <p className="mt-4 text-fm-muted">
          Nos comunicaremos a la brevedad al email <span className="font-medium text-fm-text">{email}</span> o al
          teléfono <span className="font-medium text-fm-text">{telefono}</span>.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-fm-border bg-white px-6 py-3 text-sm font-semibold uppercase tracking-widest text-fm-text transition-colors hover:bg-gray-50"
          >
            VOLVER AL INICIO
          </Link>
          <button
            type="button"
            onClick={resetTodo}
            className="inline-flex items-center justify-center bg-fm-red px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-red-700"
          >
            HACER OTRA RESERVA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-center text-2xl font-bold tracking-widest text-fm-text">RESERVÁ TU UNIDAD</h1>
      <p className="mb-8 text-center text-fm-muted">
        Seleccioná la unidad, elegí tus fechas y enviá tu consulta.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {casas.map((casa) => {
          const sel = casaId === casa.id;
          const img = casa.fotos?.[0];
          return (
            <button
              key={casa.id}
              type="button"
              onClick={() => setCasaId(casa.id)}
              className={cn(
                "overflow-hidden rounded-lg border-2 bg-white text-left transition-all",
                sel ? "border-fm-red bg-red-50" : "border-transparent shadow-sm hover:border-fm-border"
              )}
            >
              <div className="relative h-40 w-full bg-gray-100">
                {img ? (
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-fm-muted">Sin foto</div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-gray-800">{casa.nombre}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-fm-muted">
                  <Users className="h-4 w-4 text-fm-red" />
                  Hasta {casa.capacidad_personas} personas
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-fm-muted">{descripcionUnaLinea(casa) || "—"}</p>
              </div>
            </button>
          );
        })}
      </div>

      {casaSeleccionada ? (
        <FadeInSection className="mt-12">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-widest text-fm-text">
            ELEGÍ TUS FECHAS
          </h2>
          <Calendario
            mesActual={mesActual}
            onMesChange={setMesActual}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onSelectFecha={handleSelectFecha}
            fechasBloqueadas={fechasBloqueadas}
          />
          {desdeYmd && hastaYmd ? (
            <p className="mt-4 text-center font-semibold text-fm-red">
              📅 Del {formatFechaAR(desdeYmd)} al {formatFechaAR(hastaYmd)} — {noches} noches
            </p>
          ) : (
            <p className="mt-4 text-center text-sm text-fm-muted">
              Elegí la fecha de ingreso y luego la de salida.
            </p>
          )}
        </FadeInSection>
      ) : null}

      {casaSeleccionada && desdeYmd && hastaYmd ? (
        <FadeInSection className="mt-12">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-widest text-fm-text">
            TUS DATOS
          </h2>
          <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border border-fm-border px-4 py-3 outline-none ring-fm-red focus:ring-2"
                  autoComplete="given-name"
                />
                {errors.nombre ? <p className="mt-1 text-xs text-fm-red">{errors.nombre}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Apellido *</label>
                <input
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className="w-full rounded-lg border border-fm-border px-4 py-3 outline-none ring-fm-red focus:ring-2"
                  autoComplete="family-name"
                />
                {errors.apellido ? <p className="mt-1 text-xs text-fm-red">{errors.apellido}</p> : null}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-fm-border px-4 py-3 outline-none ring-fm-red focus:ring-2"
                  autoComplete="email"
                />
                {errors.email ? <p className="mt-1 text-xs text-fm-red">{errors.email}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono *</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full rounded-lg border border-fm-border px-4 py-3 outline-none ring-fm-red focus:ring-2"
                  autoComplete="tel"
                />
                {errors.telefono ? <p className="mt-1 text-xs text-fm-red">{errors.telefono}</p> : null}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Personas *</label>
              <select
                value={personas}
                onChange={(e) => setPersonas(Number(e.target.value))}
                className="w-full rounded-lg border border-fm-border px-4 py-3 outline-none ring-fm-red focus:ring-2 sm:max-w-xs"
              >
                {Array.from({ length: casaSeleccionada.capacidad_personas }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors.personas ? <p className="mt-1 text-xs text-fm-red">{errors.personas}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mensaje (opcional)</label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-fm-border px-4 py-3 outline-none ring-fm-red focus:ring-2"
              />
            </div>

            <div className="rounded-xl border border-fm-border bg-gray-50 p-4 text-sm">
              <p>
                <span className="font-medium text-gray-800">Unidad:</span> {casaSeleccionada.nombre}
              </p>
              <p className="mt-2">
                <span className="font-medium text-gray-800">Estadía:</span> Del {formatFechaAR(desdeYmd)} al{" "}
                {formatFechaAR(hastaYmd)} ({noches} noches)
              </p>
              <p className="mt-2">
                <span className="font-medium text-gray-800">Personas:</span> {personas}
              </p>
              {casaSeleccionada.precio_noche != null && casaSeleccionada.precio_noche > 0 ? (
                <p className="mt-2 font-semibold text-fm-red">
                  Estimado: {formatPrecio(noches * casaSeleccionada.precio_noche)}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-fm-red py-4 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              ENVIAR SOLICITUD DE RESERVA
            </button>
          </form>
        </FadeInSection>
      ) : null}
    </div>
  );
}
