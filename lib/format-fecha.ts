import { parseYmdLocal } from "@/lib/date-ymd";

const TZ = "America/Argentina/Buenos_Aires";

export function formatFechaCorta(isoYmd: string): string {
  const d = parseYmdLocal(isoYmd);
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatFechaLarga(isoYmd: string): string {
  const d = parseYmdLocal(isoYmd);
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatRangoFechas(desde: string, hasta: string): string {
  const n = Math.max(0, Math.round((parseYmdLocal(hasta).getTime() - parseYmdLocal(desde).getTime()) / 86400000));
  const left = formatFechaCorta(desde).replace(".", "");
  const right = formatFechaCorta(hasta).replace(".", "");
  return `${left} → ${right} · ${n} noche${n === 1 ? "" : "s"}`;
}

export function formatRelativo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return formatFechaCorta(d.toISOString().slice(0, 10));
}

