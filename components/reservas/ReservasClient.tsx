"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Users } from "lucide-react";
import { crearReserva } from "@/app/actions/reservas";
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

function usarNextImageRemoto(src: string): boolean {
  try {
    const u = new URL(src);
    if (u.protocol !== "https:") return false;
    if (u.hostname === "images.unsplash.com") return true;
    if (u.hostname.endsWith(".public.blob.vercel-storage.com")) return true;
    return false;
  } catch {
    return false;
  }
}

/** Local y dominios permitidos en `next.config` → `next/image`; el resto `<img>` para no romper por host desconocido. */
function CasaCardImage({ src }: { src: string }) {
  if (src.startsWith("/")) {
    return (
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 33vw"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
      />
    );
  }
  if (usarNextImageRemoto(src)) {
    return (
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 33vw"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
      />
    );
  }
  return <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />;
}

export function ReservasClient({
  casas,
  casasLoadFailed = false,
  noDatabase = false,
  whatsappE164,
  emailContacto,
}: {
  casas: Casa[];
  casasLoadFailed?: boolean;
  noDatabase?: boolean;
  whatsappE164?: string | null;
  emailContacto?: string | null;
}) {
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
  const [adultos, setAdultos] = useState(1);
  const [ninos, setNinos] = useState(0);
  const [mascotas, setMascotas] = useState(0);
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
    if (!casaSeleccionada) return;
    const cap = casaSeleccionada.capacidad_personas;
    setAdultos((aPrev) => {
      const a = Math.min(Math.max(1, aPrev), Math.min(10, cap));
      setNinos((nPrev) => Math.min(Math.max(0, nPrev), Math.max(0, cap - a)));
      return a;
    });
  }, [casaSeleccionada]);

  /** Tras elegir unidad, el calendario queda debajo; acercamos la vista (antes FadeInSection lo dejaba invisible hasta scrollear). */
  useEffect(() => {
    if (!casaSeleccionada) return;
    const id = window.setTimeout(() => {
      document.getElementById("reservas-calendario")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(id);
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

  const capHuespedes = casaSeleccionada?.capacidad_personas ?? 0;
  const maxAdultosOpcion = Math.min(10, Math.max(1, capHuespedes));
  const maxNinosOpcion = Math.min(10, Math.max(0, capHuespedes - adultos));

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "Requerido";
    if (!apellido.trim()) e.apellido = "Requerido";
    if (!email.trim()) e.email = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Email inválido";
    if (!telefono.trim()) e.telefono = "Requerido";
    if (!Number.isFinite(adultos) || adultos < 1) e.adultos = "Requerido";
    if (!Number.isFinite(ninos) || ninos < 0) e.ninos = "Valor inválido";
    if (!Number.isFinite(mascotas) || mascotas < 0 || mascotas > 5) e.mascotas = "Entre 0 y 5";
    if (casaSeleccionada && adultos + ninos > casaSeleccionada.capacidad_personas) {
      e.ninos = `Máximo ${casaSeleccionada.capacidad_personas} personas (adultos + niños).`;
    }
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
      adultos,
      ninos,
      mascotas,
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
    setAdultos(1);
    setNinos(0);
    setMascotas(0);
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
          Tu reserva quedó registrada como <strong className="text-fm-text">pendiente</strong>. El administrador la
          revisará y te confirmará por{" "}
          <span className="font-medium text-fm-text">{email}</span> o{" "}
          <span className="font-medium text-fm-text">{telefono}</span>.
        </p>
        <ul className="mx-auto mt-6 max-w-sm space-y-1 rounded-lg border border-fm-border bg-gray-50 px-4 py-3 text-left text-sm text-fm-muted">
          <li>
            <span className="font-medium text-fm-text">Adultos:</span> {adultos}
          </li>
          <li>
            <span className="font-medium text-fm-text">Niños:</span> {ninos}
          </li>
          <li>
            <span className="font-medium text-fm-text">Mascotas:</span> {mascotas}
          </li>
        </ul>
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
      <p className="mb-2 text-center text-fm-muted">
        Seleccioná la unidad, elegí tus fechas disponibles y completá tus datos. La solicitud queda{" "}
        <strong className="text-fm-text">pendiente de confirmación</strong> por el complejo.
      </p>
      <p className="mb-8 text-center text-sm text-fm-muted">
        En el calendario, las fechas tachadas o en gris ya están ocupadas (reservas confirmadas o en revisión) o son
        pasadas.
      </p>

      {casas.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50/90 px-6 py-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-fm-text">
            {noDatabase
              ? "Reservas no disponibles (sin base de datos)"
              : casasLoadFailed
                ? "No pudimos cargar las unidades"
                : "No hay unidades para elegir aún"}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fm-muted">
            {noDatabase
              ? "Falta configurar la base de datos en el servidor (variable DATABASE_URL). Si vos administrás el sitio, revisá el archivo .env.local o el despliegue en Vercel."
              : casasLoadFailed
                ? "Hubo un error al consultar la base de datos. Probá recargar la página en unos minutos."
                : "En /admin/casas activá el interruptor «Activa» para cada unidad (CASA 1, CASA 2, etc.). Si en el inicio ves «unidades de marketing», son otro tipo de dato: igual necesitás casas activas en la tabla casas para reservar acá. Si ya están activas y no ves cambios, probá recargar sin caché (Ctrl+F5)."}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {whatsappE164 ? (
              <a
                href={`https://wa.me/${whatsappE164.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, quiero consultar por una reserva.")}`}
                className="inline-flex w-full items-center justify-center rounded-lg bg-fm-red px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-red-700 sm:w-auto"
              >
                Escribir por WhatsApp
              </a>
            ) : null}
            {emailContacto ? (
              <a
                href={`mailto:${emailContacto}?subject=${encodeURIComponent("Consulta por reserva")}`}
                className="inline-flex w-full items-center justify-center rounded-lg border-2 border-fm-border bg-white px-5 py-3 text-sm font-semibold uppercase tracking-wide text-fm-text transition-colors hover:bg-gray-50 sm:w-auto"
              >
                Enviar email
              </a>
            ) : null}
          </div>
        </div>
      ) : (
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
                  <CasaCardImage src={img} />
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
      )}

      {casaSeleccionada ? (
        <div id="reservas-calendario" className="mt-12 scroll-mt-8">
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
        </div>
      ) : null}

      {casaSeleccionada && desdeYmd && hastaYmd ? (
        <div className="mt-12 scroll-mt-8">
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
                  required
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
                  required
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
                  required
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
                  required
                  className="w-full rounded-lg border border-fm-border px-4 py-3 outline-none ring-fm-red focus:ring-2"
                  autoComplete="tel"
                />
                {errors.telefono ? <p className="mt-1 text-xs text-fm-red">{errors.telefono}</p> : null}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad de Adultos *</label>
                <select
                  value={adultos}
                  onChange={(e) => {
                    const a = Number(e.target.value);
                    setAdultos(a);
                    setNinos((n) => Math.min(n, Math.max(0, capHuespedes - a)));
                  }}
                  className="w-full rounded-lg border border-fm-border px-4 py-3 outline-none ring-fm-red focus:ring-2"
                >
                  {Array.from({ length: maxAdultosOpcion }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {errors.adultos ? <p className="mt-1 text-xs text-fm-red">{errors.adultos}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad de Niños</label>
                <select
                  value={ninos}
                  onChange={(e) => setNinos(Number(e.target.value))}
                  className="w-full rounded-lg border border-fm-border px-4 py-3 outline-none ring-fm-red focus:ring-2"
                >
                  {Array.from({ length: maxNinosOpcion + 1 }, (_, i) => i).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                {errors.ninos ? <p className="mt-1 text-xs text-fm-red">{errors.ninos}</p> : null}
              </div>
            </div>
            <div className="sm:w-1/2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad de Mascotas</label>
              <select
                value={mascotas}
                onChange={(e) => setMascotas(Number(e.target.value))}
                className="w-full rounded-lg border border-fm-border px-4 py-3 outline-none ring-fm-red focus:ring-2"
              >
                {Array.from({ length: 6 }, (_, i) => i).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              {errors.mascotas ? <p className="mt-1 text-xs text-fm-red">{errors.mascotas}</p> : null}
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
                <span className="font-medium text-gray-800">Adultos:</span> {adultos}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-800">Niños:</span> {ninos}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-800">Mascotas:</span> {mascotas}
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
        </div>
      ) : null}
    </div>
  );
}
