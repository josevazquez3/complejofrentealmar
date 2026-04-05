import { formatFechaCorta } from "@/lib/format-fecha";
import type { ReservaAdmin } from "@/types";

/** Mínimo de dígitos para considerar un número usable en wa.me */
const MIN_DIGITS = 8;

export const WHATSAPP_MENSAJE_DEFAULT =
  `Hola {nombre} {apellido}! 🏖️\n` +
  `Tu reserva en {complejo} fue *APROBADA*.\n\n` +
  `📅 Ingreso: {fecha_inicio}\n` +
  `📅 Egreso: {fecha_fin}\n` +
  `🏠 Unidad: {unidad}\n` +
  `👥 Adultos: {adultos} | Niños: {ninos} | Mascotas: {mascotas}\n\n` +
  `💰 Importe de la seña: {senia}\n` +
  `Para confirmar la reserva, te pedimos que la abones.\n` +
  `¡Gracias! 🙏`;

/** Valor inicial del textarea en admin: lo guardado en BD o la plantilla por defecto. */
export function mensajeWhatsappParaEditor(guardado: string | null | undefined): string {
  const t = (guardado ?? "").trim();
  return t ? t : WHATSAPP_MENSAJE_DEFAULT;
}

export interface WaConfirmacionConfig {
  whatsappE164: string;
  whatsappMensaje: string;
  nombreComplejo: string;
}

/**
 * Sustituye placeholders en la plantilla. Usa `ReservaAdmin` del dominio (fecha_desde/hasta, casas.nombre).
 */
export function armarMensajeWhatsApp(
  reserva: ReservaAdmin,
  config: { whatsappMensaje: string; nombreComplejo: string },
  seniaOverride?: string
): string {
  const plantilla = config.whatsappMensaje?.trim() || WHATSAPP_MENSAJE_DEFAULT;
  const nombre = (reserva.nombre ?? "").trim();
  const apellido = (reserva.apellido ?? "").trim();
  const unidad = reserva.casas?.nombre ?? "—";
  const seniaTexto = seniaOverride?.trim()
    ? `$${seniaOverride.trim()}`
    : "a coordinar";

  return plantilla
    .replace(/{nombre}/g, nombre || "Cliente")
    .replace(/{apellido}/g, apellido)
    .replace(/{complejo}/g, config.nombreComplejo)
    .replace(/{fecha_inicio}/g, formatFechaCorta(reserva.fecha_desde))
    .replace(/{fecha_fin}/g, formatFechaCorta(reserva.fecha_hasta))
    .replace(/{unidad}/g, unidad)
    .replace(/{adultos}/g, String(reserva.adultos))
    .replace(/{ninos}/g, String(reserva.ninos))
    .replace(/{mascotas}/g, String(reserva.mascotas ?? 0))
    .replace(/{senia}/g, seniaTexto);
}

/**
 * Arma el enlace wa.me hacia el teléfono del huésped con el texto de aprobación.
 */
export function waMeUrlConfirmacionReserva(
  reserva: ReservaAdmin,
  config: WaConfirmacionConfig,
  seniaOverride?: string
): string | null {
  const cfg = config.whatsappE164.replace(/\D/g, "");
  if (cfg.length < MIN_DIGITS) return null;
  const guest = (reserva.telefono ?? "").replace(/\D/g, "");
  if (guest.length < MIN_DIGITS) return null;

  const msg = armarMensajeWhatsApp(reserva, config, seniaOverride);
  return `https://wa.me/${guest}?text=${encodeURIComponent(msg)}`;
}

export type PuedeConfirmarWhatsappResult = { ok: true } | { ok: false; razon: string };

export function puedeConfirmarPorWhatsApp(
  estadoReserva: string | null | undefined,
  whatsappE164: string,
  telefonoHuesped: string | null | undefined
): PuedeConfirmarWhatsappResult {
  if ((estadoReserva ?? "pendiente") !== "confirmada") {
    return { ok: false, razon: "La reserva debe estar confirmada." };
  }
  const cfg = whatsappE164.replace(/\D/g, "");
  if (cfg.length < MIN_DIGITS) {
    return { ok: false, razon: "Configurá el número de WhatsApp en Configuración del complejo." };
  }
  const guest = (telefonoHuesped ?? "").replace(/\D/g, "");
  if (guest.length < MIN_DIGITS) {
    return { ok: false, razon: "El huésped no tiene un teléfono válido en la reserva." };
  }
  return { ok: true };
}

export function tituloBotonWhatsapp(opts: {
  check: PuedeConfirmarWhatsappResult;
  url: string | null;
  seniaOverride?: string;
}): string {
  if (!opts.check.ok) return opts.check.razon;
  if (!opts.url) return "No se pudo generar el enlace";
  const t = opts.seniaOverride?.trim();
  if (t) return `Enviar confirmación (Seña: $${t})`;
  return "Enviar confirmación (seña: a coordinar)";
}
