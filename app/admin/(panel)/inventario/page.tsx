import {
  getCategorias,
  getCasasActivas,
  getInventarioItems,
  getInventarioItemsSinPaginar,
  getInventarioStats,
} from "@/lib/queries";
import type { EstadoItem } from "@/types";
import { InventarioClient, type VistaInventario } from "@/components/admin/inventario/InventarioClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type RawSearchParams = { [key: string]: string | string[] | undefined };

function parseVista(v: string | undefined): VistaInventario {
  const t = v?.trim().toLowerCase();
  if (t === "unidad" || t === "stockbajo") return t;
  return "lista";
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0] != null && v[0] !== "") return v[0];
  return undefined;
}

async function resolveSearchParams(
  searchParams: RawSearchParams | Promise<RawSearchParams>
): Promise<RawSearchParams> {
  return searchParams instanceof Promise ? await searchParams : searchParams;
}

export default async function AdminInventarioPage({
  searchParams,
}: {
  searchParams: RawSearchParams | Promise<RawSearchParams>;
}) {
  const sp = await resolveSearchParams(searchParams);
  const vista = parseVista(firstParam(sp.vista));
  const page = Math.max(1, parseInt(String(firstParam(sp.page) ?? "1"), 10) || 1);
  const casaId = firstParam(sp.casa);
  const categoriaId = firstParam(sp.categoria);
  const estadoRaw = firstParam(sp.estado) ?? "todos";
  const estado: EstadoItem | undefined =
    estadoRaw === "todos"
      ? undefined
      : (["bueno", "regular", "malo", "dado_de_baja"].includes(estadoRaw)
          ? (estadoRaw as EstadoItem)
          : undefined);
  const q = firstParam(sp.q) ?? "";

  const [stats, casas, categorias] = await Promise.all([
    getInventarioStats(),
    getCasasActivas(),
    getCategorias(),
  ]);

  const commonFilters = { casaId, categoriaId, estado, busqueda: q };

  if (vista === "unidad") {
    const items = await getInventarioItemsSinPaginar(commonFilters);
    return (
      <InventarioClient
        items={items}
        totalCount={items.length}
        page={1}
        pageSize={PAGE_SIZE}
        stats={stats}
        casas={casas.map((c) => ({ id: c.id, nombre: c.nombre }))}
        categorias={categorias}
        vista="unidad"
        filters={{
          casaId,
          categoriaId,
          estado: estadoRaw,
          q,
        }}
      />
    );
  }

  const soloStockBajo = vista === "stockbajo";
  const { data, count } = await getInventarioItems({
    ...commonFilters,
    soloStockBajo,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <InventarioClient
      items={data}
      totalCount={count}
      page={page}
      pageSize={PAGE_SIZE}
      stats={stats}
      casas={casas.map((c) => ({ id: c.id, nombre: c.nombre }))}
      categorias={categorias}
      vista={vista}
      filters={{
        casaId,
        categoriaId,
        estado: estadoRaw,
        q,
      }}
    />
  );
}
