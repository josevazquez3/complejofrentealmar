"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toYmdLocal } from "@/lib/date-ymd";
import type { FechaBloqueada } from "@/types";

export interface CalendarioProps {
  mesActual: Date;
  onMesChange: (fecha: Date) => void;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  onSelectFecha: (fecha: Date) => void;
  fechasBloqueadas: FechaBloqueada[];
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function isDayBlocked(ymd: string, bloqueados: FechaBloqueada[]): boolean {
  return bloqueados.some((b) => ymd >= b.fecha_desde && ymd <= b.fecha_hasta);
}

function mondayIndexFromSunday(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function MonthGrid({
  month,
  fechaDesde,
  fechaHasta,
  fechasBloqueadas,
  onSelectFecha,
  todayYmd,
}: {
  month: Date;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  fechasBloqueadas: FechaBloqueada[];
  onSelectFecha: (d: Date) => void;
  todayYmd: string;
}) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0).getDate();
  const pad = mondayIndexFromSunday(first.getDay());
  const desdeYmd = fechaDesde ? toYmdLocal(fechaDesde) : null;
  const hastaYmd = fechaHasta ? toYmdLocal(fechaHasta) : null;

  const cells: (number | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);

  const title = first.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="min-w-0">
      <p className="mb-3 text-center text-sm font-semibold capitalize text-fm-text">{title}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-fm-muted">
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
          <span key={d} className="py-1 font-medium">
            {d}
          </span>
        ))}
        {cells.map((day, idx) => {
          if (day === null) {
            return <span key={`e-${idx}`} className="h-9" />;
          }
          const cellDate = new Date(y, m, day);
          const ymd = toYmdLocal(cellDate);
          const pasado = ymd < todayYmd;
          const bloqueado = isDayBlocked(ymd, fechasBloqueadas);
          const esHoy = ymd === todayYmd;
          const esDesde = desdeYmd !== null && ymd === desdeYmd;
          const esHasta = hastaYmd !== null && ymd === hastaYmd;
          const enRango =
            Boolean(desdeYmd && hastaYmd && ymd > desdeYmd && ymd < hastaYmd);

          const disabled = pasado || bloqueado;

          return (
            <button
              key={ymd}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) onSelectFecha(cellDate);
              }}
              className={cn(
                "flex h-9 w-full items-center justify-center text-sm transition-colors",
                disabled && "cursor-not-allowed text-gray-300 line-through",
                !disabled && "cursor-pointer rounded-full hover:bg-gray-100",
                esDesde && "rounded-full bg-fm-red font-bold text-white hover:bg-fm-red",
                esHasta && "rounded-full bg-fm-red font-bold text-white hover:bg-fm-red",
                enRango && "rounded-none bg-red-100 font-medium text-fm-red",
                esHoy && !esDesde && !esHasta && !enRango && !disabled && "ring-1 ring-fm-red ring-inset"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Calendario({
  mesActual,
  onMesChange,
  fechaDesde,
  fechaHasta,
  onSelectFecha,
  fechasBloqueadas,
}: CalendarioProps) {
  const todayYmd = toYmdLocal(new Date());
  const inicioMesActual = startOfMonth(new Date());
  const puedeRetroceder = monthKey(startOfMonth(mesActual)) > monthKey(inicioMesActual);

  function irMes(delta: number) {
    const n = addMonths(mesActual, delta);
    if (delta < 0 && monthKey(startOfMonth(n)) < monthKey(inicioMesActual)) return;
    onMesChange(n);
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!puedeRetroceder}
          onClick={() => irMes(-1)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-fm-border transition-colors",
            puedeRetroceder
              ? "text-fm-text hover:bg-gray-100"
              : "cursor-not-allowed text-gray-300"
          )}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => irMes(1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-fm-border text-fm-text transition-colors hover:bg-gray-100"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <MonthGrid
          month={mesActual}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          fechasBloqueadas={fechasBloqueadas}
          onSelectFecha={onSelectFecha}
          todayYmd={todayYmd}
        />
        <div className="hidden lg:block">
          <MonthGrid
            month={addMonths(mesActual, 1)}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            fechasBloqueadas={fechasBloqueadas}
            onSelectFecha={onSelectFecha}
            todayYmd={todayYmd}
          />
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-fm-muted">
        Leyenda: días tachados en gris — no disponibles (ocupados o ya pasados). Podés tocar una fecha de ingreso y
        otra de salida para armar el rango.
      </p>
    </div>
  );
}
