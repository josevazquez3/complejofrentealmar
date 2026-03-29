"use client";

import { useMemo, useState } from "react";
import type { TesoreriaMovimiento } from "@/types";
import { formatMonto } from "@/lib/format-moneda";
import { CategoriaTesoreriaIcon } from "./CategoriaTesoreriaIcon";
import { cn } from "@/lib/utils";

type MesBucket = {
  key: string;
  label: string;
  desde: string;
  hasta: string;
  ingresos: number;
  egresos: number;
};

function ultimos6Meses(): MesBucket[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const y = d.getFullYear();
    const m = d.getMonth();
    const desde = new Date(y, m, 1).toISOString().slice(0, 10);
    const hasta = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    const label = d.toLocaleString("es-AR", { month: "short" });
    return {
      key: `${y}-${m}`,
      label: label.replace(".", ""),
      desde,
      hasta,
      ingresos: 0,
      egresos: 0,
    };
  });
}

export function ResumenTesoreria({ movimientos }: { movimientos: TesoreriaMovimiento[] }) {
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  const buckets = useMemo(() => {
    const base = ultimos6Meses();
    for (const m of movimientos) {
      const f = m.fecha.slice(0, 10);
      const b = base.find((bucket) => f >= bucket.desde && f <= bucket.hasta);
      if (!b) continue;
      if (m.tipo === "ingreso") b.ingresos += m.monto;
      else b.egresos += m.monto;
    }
    return base;
  }, [movimientos]);

  const maxVal = useMemo(() => {
    const m = Math.max(...buckets.flatMap((b) => [b.ingresos, b.egresos]), 1);
    return m * 1.05;
  }, [buckets]);

  const chartW = 520;
  const chartH = 220;
  const padL = 44;
  const padB = 28;
  const padT = 16;
  const innerW = chartW - padL - 12;
  const innerH = chartH - padB - padT;
  const n = buckets.length;
  const groupW = innerW / n;
  const barW = Math.min(28, (groupW * 0.35));

  const porCategoriaIngresos = useMemo(() => {
    const map = new Map<string, { nombre: string; icono?: string | null; total: number }>();
    for (const m of movimientos) {
      if (m.tipo !== "ingreso") continue;
      const id = m.tesoreria_categorias?.id ?? "_sin";
      const nombre = m.tesoreria_categorias?.nombre ?? "Sin categoría";
      const icono = m.tesoreria_categorias?.icono;
      const cur = map.get(id) ?? { nombre, icono, total: 0 };
      cur.total += m.monto;
      map.set(id, cur);
    }
    const arr = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const tot = arr.reduce((s, x) => s + x.total, 0) || 1;
    return arr.map((x) => ({ ...x, pct: (x.total / tot) * 100 }));
  }, [movimientos]);

  const porCategoriaEgresos = useMemo(() => {
    const map = new Map<string, { nombre: string; icono?: string | null; total: number }>();
    for (const m of movimientos) {
      if (m.tipo !== "egreso") continue;
      const id = m.tesoreria_categorias?.id ?? "_sin";
      const nombre = m.tesoreria_categorias?.nombre ?? "Sin categoría";
      const icono = m.tesoreria_categorias?.icono;
      const cur = map.get(id) ?? { nombre, icono, total: 0 };
      cur.total += m.monto;
      map.set(id, cur);
    }
    const arr = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const tot = arr.reduce((s, x) => s + x.total, 0) || 1;
    return arr.map((x) => ({ ...x, pct: (x.total / tot) * 100 }));
  }, [movimientos]);

  const porCasa = useMemo(() => {
    const map = new Map<string, { nombre: string; ing: number; egr: number }>();
    for (const m of movimientos) {
      const id = m.casas?.id ?? "_na";
      const nombre = m.casas?.nombre ?? "Sin unidad";
      const cur = map.get(id) ?? { nombre, ing: 0, egr: 0 };
      if (m.tipo === "ingreso") cur.ing += m.monto;
      else cur.egr += m.monto;
      map.set(id, cur);
    }
    return Array.from(map.entries()).map(([id, v]) => ({
      id,
      ...v,
      balance: v.ing - v.egr,
    }));
  }, [movimientos]);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Últimos 6 meses</h2>
      <div className="relative overflow-x-auto rounded-xl border border-fm-border bg-white p-4 shadow-sm">
        <svg
          width={chartW}
          height={chartH}
          className="mx-auto max-w-full"
          viewBox={`0 0 ${chartW} ${chartH}`}
          role="img"
          aria-label="Ingresos y egresos por mes"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + innerH * (1 - t);
            const val = maxVal * t;
            return (
              <g key={t}>
                <line x1={padL} y1={y} x2={chartW - 12} y2={y} stroke="#e5e5e5" strokeWidth={1} />
                <text x={4} y={y + 4} className="fill-fm-muted text-[10px]">
                  {formatMonto(val)}
                </text>
              </g>
            );
          })}
          {buckets.map((b, i) => {
            const cx = padL + i * groupW + groupW / 2;
            const hIn = (b.ingresos / maxVal) * innerH;
            const hEg = (b.egresos / maxVal) * innerH;
            const baseY = padT + innerH;
            const xIn = cx - barW - 2;
            const xEg = cx + 2;
            return (
              <g key={b.key}>
                <rect
                  x={xIn}
                  y={baseY - hIn}
                  width={barW}
                  height={hIn}
                  fill="#16a34a"
                  rx={3}
                  className="cursor-pointer hover:opacity-90"
                  onMouseEnter={(e) =>
                    setTip({
                      x: e.clientX,
                      y: e.clientY,
                      text: `Ingresos ${b.label}: ${formatMonto(b.ingresos)}`,
                    })
                  }
                  onMouseLeave={() => setTip(null)}
                />
                <rect
                  x={xEg}
                  y={baseY - hEg}
                  width={barW}
                  height={hEg}
                  fill="#dc2626"
                  rx={3}
                  className="cursor-pointer hover:opacity-90"
                  onMouseEnter={(e) =>
                    setTip({
                      x: e.clientX,
                      y: e.clientY,
                      text: `Egresos ${b.label}: ${formatMonto(b.egresos)}`,
                    })
                  }
                  onMouseLeave={() => setTip(null)}
                />
                <text x={cx} y={chartH - 6} textAnchor="middle" className="fill-gray-600 text-[11px] capitalize">
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
        {tip ? (
          <div
            className="pointer-events-none fixed z-[100] rounded-md border border-fm-border bg-white px-2 py-1 text-xs shadow-lg"
            style={{ left: tip.x + 12, top: tip.y + 12 }}
          >
            {tip.text}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap justify-center gap-6 text-sm text-fm-muted">
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-green-600" />
            Ingresos
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-red-600" />
            Egresos
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold text-green-800">Ingresos por categoría</h3>
          <div className="overflow-hidden rounded-xl border border-fm-border">
            <table className="w-full text-sm">
              <thead className="bg-green-50 text-left text-xs text-fm-muted">
                <tr>
                  <th className="px-3 py-2">Categoría</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                  <th className="px-3 py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {porCategoriaIngresos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-fm-muted">
                      Sin datos
                    </td>
                  </tr>
                ) : (
                  porCategoriaIngresos.map((row, idx) => (
                    <tr key={idx} className="border-t border-fm-border">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2 font-medium text-gray-800">
                          <CategoriaTesoreriaIcon icono={row.icono} />
                          {row.nombre}
                        </span>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-green-200">
                          <div className="h-full bg-green-600" style={{ width: `${row.pct}%` }} />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-green-700">{formatMonto(row.total)}</td>
                      <td className="px-3 py-2 text-right text-fm-muted">{row.pct.toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-red-700">Egresos por categoría</h3>
          <div className="overflow-hidden rounded-xl border border-fm-border">
            <table className="w-full text-sm">
              <thead className="bg-red-50 text-left text-xs text-fm-muted">
                <tr>
                  <th className="px-3 py-2">Categoría</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                  <th className="px-3 py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {porCategoriaEgresos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-fm-muted">
                      Sin datos
                    </td>
                  </tr>
                ) : (
                  porCategoriaEgresos.map((row, idx) => (
                    <tr key={idx} className="border-t border-fm-border">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2 font-medium text-gray-800">
                          <CategoriaTesoreriaIcon icono={row.icono} />
                          {row.nombre}
                        </span>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-red-200">
                          <div className="h-full bg-red-600" style={{ width: `${row.pct}%` }} />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-red-600">{formatMonto(row.total)}</td>
                      <td className="px-3 py-2 text-right text-fm-muted">{row.pct.toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="mb-3 font-semibold text-gray-800">Por unidad</h3>
        <div className="overflow-x-auto rounded-xl border border-fm-border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-fm-muted">
              <tr>
                <th className="px-3 py-2">Casa</th>
                <th className="px-3 py-2 text-right">Ingresos</th>
                <th className="px-3 py-2 text-right">Egresos</th>
                <th className="px-3 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {porCasa.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-fm-muted">
                    Sin datos
                  </td>
                </tr>
              ) : (
                porCasa.map((row) => (
                  <tr key={row.id} className="border-t border-fm-border">
                    <td className="px-3 py-2 font-medium text-gray-800">{row.nombre}</td>
                    <td className="px-3 py-2 text-right text-green-700">{formatMonto(row.ing)}</td>
                    <td className="px-3 py-2 text-right text-red-600">{formatMonto(row.egr)}</td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-semibold",
                        row.balance >= 0 ? "text-green-700" : "text-red-600"
                      )}
                    >
                      {formatMonto(row.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
