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

function parseVista(v: string | undefined): VistaInventario {
  if (v === "unidad" || v === "stockbajo") return v;
  return "lista";
}

export default async function AdminInventarioPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const vista = parseVista(typeof searchParams.vista === "string" ? searchParams.vista : undefined);
  const page = Math.max(1, parseInt(String(searchParams.page ?? "1"), 10) || 1);
  const casaId = typeof searchParams.casa === "string" ? searchParams.casa : undefined;
  const categoriaId = typeof searchParams.categoria === "string" ? searchParams.categoria : undefined;
  const estadoRaw = typeof searchParams.estado === "string" ? searchParams.estado : "todos";
  const estado: EstadoItem | undefined =
    estadoRaw === "todos"
      ? undefined
      : (["bueno", "regular", "malo", "dado_de_baja"].includes(estadoRaw)
          ? (estadoRaw as EstadoItem)
          : undefined);
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

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
