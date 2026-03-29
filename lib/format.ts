import { format } from "date-fns";
import { es } from "date-fns/locale/es";

export function formatDateAR(isoDate: string): string {
  try {
    return format(new Date(isoDate + "T12:00:00"), "dd/MM/yyyy", { locale: es });
  } catch {
    return isoDate;
  }
}

export function formatCurrencyAR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
}

/** DD/MM/YYYY (alias de `formatDateAR`). */
export const formatFecha = formatDateAR;

/** Moneda ARS (alias de `formatCurrencyAR`). */
export const formatMoneda = formatCurrencyAR;

export function parseARSInput(raw: string): number | null {
  const n = raw.replace(/\./g, "").replace(",", ".").trim();
  const v = Number.parseFloat(n);
  return Number.isFinite(v) ? v : null;
}
