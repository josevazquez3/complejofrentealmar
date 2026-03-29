"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EstadoInventario, InventarioConCasa } from "@/types";
import { exportToExcel } from "@/lib/excel";

function badgeVariant(estado: EstadoInventario | null): string {
  switch (estado) {
    case "Bueno":
      return "bg-emerald-600 hover:bg-emerald-600 text-white";
    case "Roto":
      return "bg-red-600 hover:bg-red-600 text-white";
    case "Faltante":
      return "bg-orange-500 hover:bg-orange-500 text-white";
    case "Baja":
      return "bg-slate-500 hover:bg-slate-500 text-white";
    default:
      return "bg-slate-400";
  }
}

export function InventarioTable({ rows }: { rows: InventarioConCasa[] }) {
  const groups = useMemo(() => {
    const m = new Map<string, InventarioConCasa[]>();
    for (const row of rows) {
      const label = row.casas?.nombre ?? "Sin casa";
      if (!m.has(label)) m.set(label, []);
      m.get(label)!.push(row);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  function exportExcel() {
    const data = rows.map((r) => ({
      Casa: r.casas?.nombre ?? "—",
      Elemento: r.elemento,
      Descripción: r.descripcion ?? "",
      Cantidad: r.cantidad ?? 0,
      Estado: r.estado ?? "",
    }));
    exportToExcel(data, "inventario.xlsx", "Inventario");
    toast.success("Archivo generado");
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl text-nautico-900">Vista de inventario</h2>
        <Button variant="outline" onClick={exportExcel} disabled={rows.length === 0}>
          Exportar Excel
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-nautico-900/10">
        <Table>
          <TableHeader>
            <TableRow className="bg-nautico-900/5">
              <TableHead>Casa</TableHead>
              <TableHead>Elemento</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay ítems para mostrar
                </TableCell>
              </TableRow>
            ) : (
              groups.flatMap(([casaNombre, items]) => [
                <TableRow key={`h-${casaNombre}`} className="bg-nautico-900/10 hover:bg-nautico-900/10">
                  <TableCell
                    colSpan={5}
                    className="font-display text-base font-semibold text-nautico-900"
                  >
                    {casaNombre}
                  </TableCell>
                </TableRow>,
                ...items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{"\u00a0"}</TableCell>
                    <TableCell>{r.elemento}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.descripcion ?? "—"}</TableCell>
                    <TableCell>{r.cantidad ?? 0}</TableCell>
                    <TableCell>
                      <Badge className={badgeVariant(r.estado)}>{r.estado ?? "—"}</Badge>
                    </TableCell>
                  </TableRow>
                )),
              ])
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
