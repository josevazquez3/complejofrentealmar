import * as XLSX from "xlsx";
import { formatFecha } from "@/lib/format";
import type { ReservaConCasa } from "@/types";

/**
 * Exporta un arreglo de objetos planos a un archivo .xlsx (SheetJS).
 */
export function exportToExcel(
  data: Record<string, string | number | null | undefined>[],
  filename: string,
  sheetName: string
): void {
  const safeName = sheetName.slice(0, 31) || "Hoja1";
  const ws = XLSX.utils.json_to_sheet(
    data.length ? data : [{ mensaje: "Sin datos" }]
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, safeName);
  const out = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, out);
}

function fechaHoyArchivo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Exporta reservas con columnas y nombre de archivo estándar. */
export function exportReservas(reservas: ReservaConCasa[]): void {
  const rows = reservas.map((r, i) => ({
    "N°": i + 1,
    "Fecha Desde": formatFecha(r.fecha_desde),
    "Fecha Hasta": formatFecha(r.fecha_hasta),
    Casa: r.casas?.nombre ?? "—",
    Personas: r.cant_personas,
    Mascotas: r.mascotas ?? 0,
    Saldo: r.saldo_reserva ?? "",
  }));
  exportToExcel(rows, `reservas_${fechaHoyArchivo()}.xlsx`, "Reservas");
}
