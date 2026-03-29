import {
  getCasasActivas,
  getTesoreriaCategorias,
  getTesoreriaMovimientos,
  getTesoreriaMovimientosSinPaginar,
  getTesoreriaStats,
} from "@/lib/queries";
import type { MetodoPago, TipoMovimientoTes } from "@/types";
import { TesoreriaClient, type TabTesoreria } from "@/components/admin/tesoreria/TesoreriaClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function parseTab(v: string | undefined): TabTesoreria {
  if (v === "ingresos" || v === "egresos" || v === "resumen") return v;
  return "todos";
}

export default async function AdminTesoreriaPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = parseTab(typeof searchParams.tab === "string" ? searchParams.tab : undefined);
  const page = Math.max(1, parseInt(String(searchParams.page ?? "1"), 10) || 1);
  const casaId = typeof searchParams.casa === "string" ? searchParams.casa : undefined;
  const categoriaId = typeof searchParams.categoria === "string" ? searchParams.categoria : undefined;
  const metodoRaw = typeof searchParams.metodo === "string" ? searchParams.metodo : undefined;
  const metodoPago =
    metodoRaw && ["efectivo", "transferencia", "tarjeta", "cheque", "otro"].includes(metodoRaw)
      ? (metodoRaw as MetodoPago)
      : undefined;
  const fechaDesde = typeof searchParams.desde === "string" ? searchParams.desde : undefined;
  const fechaHasta = typeof searchParams.hasta === "string" ? searchParams.hasta : undefined;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const tipoFromTab: TipoMovimientoTes | undefined =
    tab === "ingresos" ? "ingreso" : tab === "egresos" ? "egreso" : undefined;

  const d6 = new Date();
  d6.setMonth(d6.getMonth() - 5);
  const fechaDesde6Meses = `${d6.getFullYear()}-${String(d6.getMonth() + 1).padStart(2, "0")}-01`;

  const [stats, casas, categorias, movResumen] = await Promise.all([
    getTesoreriaStats(),
    getCasasActivas(),
    getTesoreriaCategorias(),
    getTesoreriaMovimientosSinPaginar({ fechaDesde: fechaDesde6Meses }),
  ]);

  const listParams = {
    tipo: tipoFromTab,
    casaId,
    categoriaId,
    metodoPago,
    fechaDesde,
    fechaHasta,
    busqueda: q,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data: movimientos, count: totalCount } =
    tab === "resumen" ? { data: [], count: 0 } : await getTesoreriaMovimientos(listParams);

  return (
    <TesoreriaClient
      movimientos={movimientos}
      totalCount={totalCount}
      page={page}
      pageSize={PAGE_SIZE}
      stats={stats}
      casas={casas.map((c) => ({ id: c.id, nombre: c.nombre }))}
      categorias={categorias}
      movimientosResumen={movResumen}
      tab={tab}
      filters={{
        casaId,
        categoriaId,
        metodoPago,
        desde: fechaDesde,
        hasta: fechaHasta,
        q,
      }}
    />
  );
}
