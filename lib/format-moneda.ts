/** Formato monetario ARS (es-AR). */

export function formatMonto(valor: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(valor);
}

export function formatMontoConSigno(valor: number, tipo: "ingreso" | "egreso"): string {
  const fmt = formatMonto(valor);
  return tipo === "ingreso" ? `+${fmt}` : `-${fmt}`;
}
