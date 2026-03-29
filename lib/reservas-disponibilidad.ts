import type { FechaBloqueada } from "@/types";

/** Solapamiento de [desde,hasta] con un rango bloqueado (intervalos inclusivos). */
export function rangoSolapaBloqueados(
  desdeYmd: string,
  hastaYmd: string,
  bloqueados: FechaBloqueada[]
): boolean {
  if (desdeYmd > hastaYmd) return true;
  return bloqueados.some((b) => desdeYmd <= b.fecha_hasta && hastaYmd >= b.fecha_desde);
}
