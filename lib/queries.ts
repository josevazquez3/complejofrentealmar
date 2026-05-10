import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InicioConfig, SeccionTexto, SeccionTextoId, Unidad } from "@/types/configuracion";
import type {
  Casa,
  CasaListItem,
  Configuracion,
  EstadoItem,
  EstadoReserva,
  FechaBloqueada,
  InventarioCategoria,
  InventarioCategoriaConConteo,
  InventarioItem,
  InventarioItemConMovimientos,
  InventarioStats,
  Reserva,
  ReservaAdmin,
  ReservaConCasa,
  ReservaInsert,
  TesoreriaCat,
  TesoreriaFiltros,
  TesoreriaMovimiento,
  TesoreriaStats,
  TipoMovimiento,
} from "@/types";

function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mapCasa(c: {
  id: string;
  nombre: string;
  descripcion: string | null;
  capacidadPersonas: number;
  fotos: string[];
  activa: boolean;
  createdAt: Date;
}): Casa {
  return {
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    capacidad_personas: c.capacidadPersonas,
    fotos: c.fotos?.length ? c.fotos : null,
    activa: c.activa,
    created_at: c.createdAt.toISOString(),
  };
}

/** Igualar nombres entre `casa.nombre` y `unidad.titulo` (marketing) para reutilizar fotos. */
function normalizarNombreUnidadFotos(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapConfig(row: {
  id: string;
  complejoNombre: string;
  tagline: string | null;
  descripcionHome: string | null;
  ubicacionDireccion: string | null;
  mapaQuery: string | null;
  whatsappMensaje?: string | null;
  whatsappE164: string | null;
  cuentaAlias: string | null;
  cuentaCbu: string | null;
  cuentaTexto: string | null;
  emailContacto: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeVideoId: string | null;
  logoUrl: string | null;
  whatsappMensajePublico: string;
  updatedAt: Date;
}): Configuracion {
  return {
    id: row.id,
    complejo_nombre: row.complejoNombre,
    tagline: row.tagline,
    descripcion_home: row.descripcionHome,
    ubicacion_direccion: row.ubicacionDireccion,
    mapa_query: row.mapaQuery,
    whatsapp_mensaje: row.whatsappMensaje ?? "",
    whatsapp_e164: row.whatsappE164,
    cuenta_alias: row.cuentaAlias,
    cuenta_cbu: row.cuentaCbu,
    cuenta: row.cuentaTexto,
    email_contacto: row.emailContacto,
    facebook_url: row.facebookUrl,
    instagram_url: row.instagramUrl,
    youtube_video_id: row.youtubeVideoId,
    logo_url: row.logoUrl,
    whatsapp_mensaje_publico: row.whatsappMensajePublico,
    updated_at: row.updatedAt.toISOString(),
  };
}

function mapReservaBase(r: {
  id: string;
  casaId: string;
  fechaDesde: Date;
  fechaHasta: Date;
  adultos: number;
  ninos: number;
  mascotas: number;
  comprobanteUrl: string | null;
  saldoReserva: Prisma.Decimal | null;
  createdAt: Date;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  mensaje: string | null;
  estado: string;
}): Reserva {
  const fd = ymd(r.fechaDesde);
  const fh = ymd(r.fechaHasta);
  return {
    id: r.id,
    casa_id: r.casaId,
    fecha_desde: fd,
    fecha_hasta: fh,
    adultos: r.adultos,
    ninos: r.ninos,
    mascotas: r.mascotas,
    comprobante_url: r.comprobanteUrl,
    saldo_reserva: r.saldoReserva != null ? Number(r.saldoReserva) : null,
    created_at: r.createdAt.toISOString(),
    nombre: r.nombre,
    apellido: r.apellido,
    email: r.email,
    telefono: r.telefono,
    mensaje: r.mensaje,
    estado: r.estado as Reserva["estado"],
    noches: Math.max(0, Math.round((r.fechaHasta.getTime() - r.fechaDesde.getTime()) / 86400000)),
  };
}

/** KPIs del layout admin (reservas pendientes). */
export async function getPendingReservasCount(): Promise<number> {
  if (!hasDb()) return 0;
  try {
    return await prisma.reserva.count({ where: { estado: "pendiente" } });
  } catch {
    return 0;
  }
}

/** Contadores del dashboard admin (mes en curso por fecha_desde). */
export async function getAdminDashboardStats(): Promise<{
  reservasMes: number;
  reservasPendientes: number;
  casasActivas: number;
}> {
  if (!hasDb()) {
    return { reservasMes: 0, reservasPendientes: 0, casasActivas: 0 };
  }
  try {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const [reservasMes, reservasPendientes, casasActivas] = await Promise.all([
      prisma.reserva.count({
        where: {
          fechaDesde: { gte: from, lte: to },
        },
      }),
      prisma.reserva.count({ where: { estado: "pendiente" } }),
      prisma.casa.count({ where: { activa: true } }),
    ]);
    return { reservasMes, reservasPendientes, casasActivas };
  } catch {
    return { reservasMes: 0, reservasPendientes: 0, casasActivas: 0 };
  }
}

export const getConfiguracion = cache(async (): Promise<Configuracion | null> => {
  if (!hasDb()) return null;
  try {
    const row = await prisma.configuracion.findFirst();
    return row ? mapConfig(row) : null;
  } catch {
    return null;
  }
});

export type CasasLoadResult = {
  casas: Casa[];
  /** Error al consultar la BD (timeout, conexión, etc.). */
  failed: boolean;
  /** No hay `DATABASE_URL` configurada. */
  noDatabase: boolean;
};

export const getCasasActivasForHome = cache(async (): Promise<CasasLoadResult> => {
  if (!hasDb()) return { casas: [], failed: false, noDatabase: true };
  try {
    const [rows, unidades] = await Promise.all([
      prisma.casa.findMany({
        where: { activa: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.unidad.findMany({
        where: { habilitada: true },
        select: { titulo: true, fotos: true },
        orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    const fotosPorTitulo = new Map<string, string[]>();
    for (const u of unidades) {
      const key = normalizarNombreUnidadFotos(u.titulo);
      if (!key) continue;
      if (!fotosPorTitulo.has(key) && u.fotos.length > 0) {
        fotosPorTitulo.set(key, u.fotos);
      }
    }

    const casas: Casa[] = rows.map((row) => {
      const base = mapCasa(row);
      if (base.fotos?.length) return base;
      const alt = fotosPorTitulo.get(normalizarNombreUnidadFotos(row.nombre));
      if (alt?.length) {
        return { ...base, fotos: alt };
      }
      return base;
    });

    return { casas, failed: false, noDatabase: false };
  } catch {
    return { casas: [], failed: true, noDatabase: false };
  }
});

export const getCasasActivas = cache(async (): Promise<Casa[]> => {
  const { casas } = await getCasasActivasForHome();
  return casas;
});

/** Listado completo para el panel (incluye inactivas). Las reservas públicas solo usan `activa: true`. */
export async function getAllCasasAdmin(): Promise<Casa[]> {
  if (!hasDb()) return [];
  try {
    const rows = await prisma.casa.findMany({ orderBy: { nombre: "asc" } });
    return rows.map(mapCasa);
  } catch {
    return [];
  }
}

export const getCasaById = cache(async (id: string): Promise<Casa | null> => {
  if (!hasDb()) return null;
  try {
    const c = await prisma.casa.findFirst({ where: { id, activa: true } });
    return c ? mapCasa(c) : null;
  } catch {
    return null;
  }
});

export const getOtrasCasas = cache(async (excludeId: string): Promise<CasaListItem[]> => {
  if (!hasDb()) return [];
  try {
    const rows = await prisma.casa.findMany({
      where: { activa: true, id: { not: excludeId } },
      select: { id: true, nombre: true, descripcion: true, fotos: true },
      orderBy: { nombre: "asc" },
      take: 3,
    });
    return rows as CasaListItem[];
  } catch {
    return [];
  }
});

export async function getHeroImageUrls(): Promise<string[]> {
  try {
    if (!hasDb()) {
      const casas = await getCasasActivas();
      const urls = casas.flatMap((c) => c.fotos ?? []).filter(Boolean);
      return Array.from(new Set(urls));
    }
    try {
      const rows = await prisma.carouselImage.findMany({
        orderBy: { orden: "asc" },
        select: { url: true },
      });
      if (rows.length > 0) return rows.map((r) => r.url).filter(Boolean);
    } catch {
      /* */
    }
    const casas = await getCasasActivas();
    const urls = casas.flatMap((c) => c.fotos ?? []).filter(Boolean);
    return Array.from(new Set(urls));
  } catch {
    return [];
  }
}

export const getInicioMarketing = cache(async (): Promise<InicioConfig | null> => {
  if (!hasDb()) return null;
  try {
    const row = await prisma.inicioConfig.findFirst();
    if (!row) return null;
    return {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      fotos: row.fotos ?? [],
      updated_at: row.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
});

export const getUnidadesMarketing = cache(async (): Promise<Unidad[]> => {
  if (!hasDb()) return [];
  try {
    const rows = await prisma.unidad.findMany({
      where: { habilitada: true },
      orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    });
    return rows.map((u) => ({
      id: u.id,
      titulo: u.titulo,
      descripcion: u.descripcion,
      precio: u.precio ?? null,
      fotos: u.fotos ?? [],
      habilitada: u.habilitada,
      orden: u.orden,
      created_at: u.createdAt.toISOString(),
      updated_at: u.updatedAt.toISOString(),
    }));
  } catch {
    return [];
  }
});

export const SECCION_PUBLIC_FALLBACK: Record<SeccionTextoId, SeccionTexto> = {
  equipamiento: {
    id: "equipamiento",
    titulo: "EQUIPAMIENTO",
    descripcion:
      "Nuestras unidades cuentan con decoración cuidada, cocina equipada, climatización en dormitorios principales, TV, ropa de cama, parrilla individual en terrazas o balcones y espacios pensados para el descanso frente al mar.",
    updated_at: "",
  },
  servicios: {
    id: "servicios",
    titulo: "SERVICIOS",
    descripcion:
      "Servicios de mucama, desayuno en temporada alta, seguridad nocturna, reposeras y atención personalizada para que su estadía sea tranquila durante las cuatro estaciones. Consulte disponibilidad y condiciones según época del año.",
    updated_at: "",
  },
};

export async function getSeccionTextoPublic(id: SeccionTextoId): Promise<SeccionTexto> {
  const fb = SECCION_PUBLIC_FALLBACK[id];
  if (!hasDb()) return fb;

  try {
    const cached = unstable_cache(
      async () => {
        const row = await prisma.seccionTexto.findUnique({ where: { id } });
        if (!row) return null;
        return {
          id: row.id as SeccionTextoId,
          titulo: row.titulo,
          descripcion: row.descripcion,
          updated_at: row.updatedAt.toISOString(),
        } satisfies SeccionTexto;
      },
      ["seccion-texto-public", id],
      { revalidate: 60 }
    );
    const v = await cached();
    return v ?? fb;
  } catch {
    return fb;
  }
}

/** Misma carga que el home: solo casas activas (reservas públicas). */
export const getCasasParaReservas = cache(async (): Promise<CasasLoadResult> => {
  return getCasasActivasForHome();
});

export async function getFechasBloqueadas(casaId: string): Promise<FechaBloqueada[]> {
  if (!hasDb()) return [];
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows = await prisma.reserva.findMany({
      where: {
        casaId,
        estado: { in: ["pendiente", "confirmada"] },
        fechaHasta: { gte: today },
      },
      select: { fechaDesde: true, fechaHasta: true },
    });
    return rows.map((r) => ({
      fecha_desde: ymd(r.fechaDesde),
      fecha_hasta: ymd(r.fechaHasta),
    }));
  } catch {
    return [];
  }
}

export async function insertarReserva(
  reserva: ReservaInsert,
  estado: EstadoReserva = "pendiente"
): Promise<Reserva> {
  const r = await prisma.reserva.create({
    data: {
      casaId: reserva.casa_id,
      fechaDesde: new Date(reserva.fecha_desde),
      fechaHasta: new Date(reserva.fecha_hasta),
      adultos: reserva.adultos,
      ninos: reserva.ninos,
      mascotas: reserva.mascotas,
      nombre: reserva.nombre,
      apellido: reserva.apellido,
      email: reserva.email,
      telefono: reserva.telefono,
      mensaje: reserva.mensaje ?? null,
      estado,
    },
  });
  return mapReservaBase(r);
}

const RESERVAS_PAGE_SIZE = 10;

export async function getReservasAdminPage(
  page: number
): Promise<{ rows: ReservaConCasa[]; total: number; pageSize: number }> {
  const pageSize = RESERVAS_PAGE_SIZE;
  const safePage = Math.max(1, page);
  if (!hasDb()) {
    return { rows: [], total: 0, pageSize };
  }
  try {
    const skip = (safePage - 1) * pageSize;
    const [rows, total] = await Promise.all([
      prisma.reserva.findMany({
        include: { casa: { select: { id: true, nombre: true, capacidadPersonas: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.reserva.count(),
    ]);
    const mapped: ReservaConCasa[] = rows.map((row) => ({
      ...mapReservaBase(row),
      casas: row.casa
        ? {
            id: row.casa.id,
            nombre: row.casa.nombre,
            capacidad_personas: row.casa.capacidadPersonas,
          }
        : null,
    }));
    return { rows: mapped, total, pageSize };
  } catch {
    return { rows: [], total: 0, pageSize };
  }
}

export async function getReservasAdmin(): Promise<ReservaAdmin[]> {
  if (!hasDb()) return [];
  const rows = await prisma.reserva.findMany({
    include: { casa: { select: { id: true, nombre: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    ...mapReservaBase(row),
    casas: row.casa ? { id: row.casa.id, nombre: row.casa.nombre } : null,
  }));
}

export async function getReservaById(id: string): Promise<ReservaAdmin | null> {
  if (!hasDb()) return null;
  const row = await prisma.reserva.findUnique({
    where: { id },
    include: { casa: { select: { id: true, nombre: true } } },
  });
  if (!row) return null;
  return {
    ...mapReservaBase(row),
    casas: row.casa ? { id: row.casa.id, nombre: row.casa.nombre } : null,
  };
}

export async function updateEstadoReserva(id: string, estado: EstadoReserva): Promise<void> {
  await prisma.reserva.update({ where: { id }, data: { estado } });
}

export async function deleteReserva(id: string): Promise<void> {
  await prisma.reserva.delete({ where: { id } });
}

const INV_INCLUDE = {
  categoria: true,
  casa: { select: { id: true, nombre: true } },
} as const;

function mapInventarioItem(row: Prisma.InventarioItemGetPayload<{ include: typeof INV_INCLUDE }>): InventarioItem {
  return {
    id: row.id,
    casa_id: row.casaId,
    categoria_id: row.categoriaId,
    nombre: row.nombre,
    descripcion: row.descripcion,
    cantidad: row.cantidad,
    cantidad_min: row.cantidadMin,
    unidad: row.unidad as InventarioItem["unidad"],
    estado: row.estado as InventarioItem["estado"],
    ubicacion: row.ubicacion,
    activo: row.activo,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    inventario_categorias: row.categoria
      ? {
          id: row.categoria.id,
          nombre: row.categoria.nombre,
          icono: row.categoria.icono,
          created_at: row.categoria.createdAt.toISOString(),
        }
      : null,
    casas: row.casa,
  };
}

export async function getCategorias(): Promise<InventarioCategoria[]> {
  if (!hasDb()) return [];
  try {
    const rows = await prisma.inventarioCategoria.findMany({ orderBy: { nombre: "asc" } });
    return rows.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      icono: c.icono,
      created_at: c.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getCategoriasInventarioConConteo(): Promise<InventarioCategoriaConConteo[]> {
  if (!hasDb()) return [];
  try {
    const rows = await prisma.inventarioCategoria.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { items: true } } },
    });
    return rows.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      icono: c.icono,
      created_at: c.createdAt.toISOString(),
      items_count: c._count.items,
    }));
  } catch {
    return [];
  }
}

export async function createInventarioCategoria(data: {
  nombre: string;
  icono?: string | null;
}): Promise<InventarioCategoria> {
  const nombre = data.nombre.trim();
  if (!nombre) throw new Error("El nombre es obligatorio.");
  const row = await prisma.inventarioCategoria.create({
    data: {
      nombre,
      icono: data.icono?.trim() || null,
    },
  });
  return {
    id: row.id,
    nombre: row.nombre,
    icono: row.icono,
    created_at: row.createdAt.toISOString(),
  };
}

export async function updateInventarioCategoria(
  id: string,
  data: { nombre?: string; icono?: string | null }
): Promise<InventarioCategoria> {
  const update: { nombre?: string; icono?: string | null } = {};
  if (data.nombre !== undefined) {
    const nombre = data.nombre.trim();
    if (!nombre) throw new Error("El nombre es obligatorio.");
    update.nombre = nombre;
  }
  if (data.icono !== undefined) {
    update.icono = data.icono?.trim() || null;
  }
  if (Object.keys(update).length === 0) {
    const cur = await prisma.inventarioCategoria.findUnique({ where: { id } });
    if (!cur) throw new Error("Categoría no encontrada.");
    return {
      id: cur.id,
      nombre: cur.nombre,
      icono: cur.icono,
      created_at: cur.createdAt.toISOString(),
    };
  }
  const row = await prisma.inventarioCategoria.update({
    where: { id },
    data: update,
  });
  return {
    id: row.id,
    nombre: row.nombre,
    icono: row.icono,
    created_at: row.createdAt.toISOString(),
  };
}

export async function deleteInventarioCategoria(id: string): Promise<void> {
  await prisma.inventarioCategoria.delete({ where: { id } });
}

export async function getInventarioItems(params: {
  casaId?: string;
  categoriaId?: string;
  estado?: EstadoItem;
  soloStockBajo?: boolean;
  busqueda?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: InventarioItem[]; count: number }> {
  const {
    casaId,
    categoriaId,
    estado,
    soloStockBajo,
    busqueda,
    page = 1,
    pageSize = 20,
  } = params;

  if (!hasDb()) return { data: [], count: 0 };

  const where: Prisma.InventarioItemWhereInput = {
    activo: true,
    ...(casaId ? { casaId } : {}),
    ...(categoriaId ? { categoriaId } : {}),
    ...(estado ? { estado } : {}),
    ...(busqueda?.trim() ? { nombre: { contains: busqueda.trim(), mode: "insensitive" } } : {}),
  };

  try {
    if (soloStockBajo) {
      const all = await prisma.inventarioItem.findMany({
        where,
        include: INV_INCLUDE,
        orderBy: { nombre: "asc" },
      });
      const filtered = all.filter((i) => i.cantidad <= i.cantidadMin).map(mapInventarioItem);
      const from = (page - 1) * pageSize;
      return { data: filtered.slice(from, from + pageSize), count: filtered.length };
    }

    const skip = (page - 1) * pageSize;
    const [raw, count] = await Promise.all([
      prisma.inventarioItem.findMany({
        where,
        include: INV_INCLUDE,
        orderBy: { nombre: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.inventarioItem.count({ where }),
    ]);
    return { data: raw.map(mapInventarioItem), count };
  } catch {
    return { data: [], count: 0 };
  }
}

export async function getInventarioItemsSinPaginar(params: {
  casaId?: string;
  categoriaId?: string;
  estado?: EstadoItem;
  busqueda?: string;
}): Promise<InventarioItem[]> {
  if (!hasDb()) return [];
  const where: Prisma.InventarioItemWhereInput = {
    activo: true,
    ...(params.casaId ? { casaId: params.casaId } : {}),
    ...(params.categoriaId ? { categoriaId: params.categoriaId } : {}),
    ...(params.estado ? { estado: params.estado } : {}),
    ...(params.busqueda?.trim()
      ? { nombre: { contains: params.busqueda.trim(), mode: "insensitive" } }
      : {}),
  };
  try {
    const rows = await prisma.inventarioItem.findMany({
      where,
      include: INV_INCLUDE,
      orderBy: { nombre: "asc" },
    });
    return rows.map(mapInventarioItem);
  } catch {
    return [];
  }
}

export async function getInventarioItemById(id: string): Promise<InventarioItemConMovimientos | null> {
  if (!hasDb()) return null;
  const row = await prisma.inventarioItem.findUnique({
    where: { id },
    include: INV_INCLUDE,
  });
  if (!row) return null;
  const movs = await prisma.inventarioMovimiento.findMany({
    where: { itemId: id },
    orderBy: { createdAt: "desc" },
  });
  return {
    ...mapInventarioItem(row),
    inventario_movimientos: movs.map((m) => ({
      id: m.id,
      item_id: m.itemId,
      tipo: m.tipo as TipoMovimiento,
      cantidad: m.cantidad,
      cantidad_anterior: m.cantidadAnterior,
      cantidad_nueva: m.cantidadNueva,
      motivo: m.motivo,
      created_at: m.createdAt.toISOString(),
    })),
  };
}

export type InventarioItemInsert = Omit<
  InventarioItem,
  "id" | "created_at" | "updated_at" | "inventario_categorias" | "casas"
>;

export async function createInventarioItem(item: InventarioItemInsert): Promise<InventarioItem> {
  const row = await prisma.inventarioItem.create({
    data: {
      casaId: item.casa_id,
      categoriaId: item.categoria_id ?? null,
      nombre: item.nombre,
      descripcion: item.descripcion ?? null,
      cantidad: item.cantidad,
      cantidadMin: item.cantidad_min,
      unidad: item.unidad,
      estado: item.estado,
      ubicacion: item.ubicacion ?? null,
      activo: item.activo,
    },
    include: INV_INCLUDE,
  });
  return mapInventarioItem(row);
}

export async function updateInventarioItem(id: string, item: Partial<InventarioItem>): Promise<void> {
  const data: Prisma.InventarioItemUpdateInput = {};
  if (item.casa_id !== undefined) data.casa = { connect: { id: item.casa_id } };
  if (item.categoria_id !== undefined)
    data.categoria = item.categoria_id ? { connect: { id: item.categoria_id } } : { disconnect: true };
  if (item.nombre !== undefined) data.nombre = item.nombre;
  if (item.descripcion !== undefined) data.descripcion = item.descripcion;
  if (item.cantidad !== undefined) data.cantidad = item.cantidad;
  if (item.cantidad_min !== undefined) data.cantidadMin = item.cantidad_min;
  if (item.unidad !== undefined) data.unidad = item.unidad;
  if (item.estado !== undefined) data.estado = item.estado;
  if (item.ubicacion !== undefined) data.ubicacion = item.ubicacion;
  if (item.activo !== undefined) data.activo = item.activo;
  await prisma.inventarioItem.update({ where: { id }, data });
}

export async function deleteInventarioItem(id: string): Promise<void> {
  await prisma.inventarioItem.update({ where: { id }, data: { activo: false } });
}

export async function registrarMovimiento(mov: {
  item_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo?: string;
}): Promise<void> {
  await prisma.inventarioMovimiento.create({
    data: {
      itemId: mov.item_id,
      tipo: mov.tipo,
      cantidad: mov.cantidad,
      cantidadAnterior: mov.cantidad_anterior,
      cantidadNueva: mov.cantidad_nueva,
      motivo: mov.motivo ?? null,
    },
  });
}

export async function getInventarioStats(): Promise<InventarioStats> {
  const empty: InventarioStats = {
    totalItems: 0,
    itemsStockBajo: 0,
    itemsMalEstado: 0,
    totalCasas: 0,
  };
  if (!hasDb()) return empty;
  try {
    const items = await prisma.inventarioItem.findMany({
      where: { activo: true },
      select: { cantidad: true, cantidadMin: true, estado: true, casaId: true },
    });
    return {
      totalItems: items.length,
      itemsStockBajo: items.filter((i) => i.cantidad <= i.cantidadMin).length,
      itemsMalEstado: items.filter((i) => ["malo", "dado_de_baja"].includes(i.estado)).length,
      totalCasas: new Set(items.map((i) => i.casaId)).size,
    };
  } catch {
    return empty;
  }
}

export async function getAllInventarioItemsForExport(): Promise<InventarioItem[]> {
  if (!hasDb()) return [];
  try {
    const rows = await prisma.inventarioItem.findMany({
      where: { activo: true },
      include: INV_INCLUDE,
      orderBy: { nombre: "asc" },
    });
    return rows.map(mapInventarioItem);
  } catch {
    return [];
  }
}

const TES_INCLUDE = {
  categoria: true,
  casa: { select: { id: true, nombre: true } },
  reserva: { select: { id: true, nombre: true, apellido: true } },
} as const;

function mapTesoreriaMov(
  row: Prisma.TesoreriaMovimientoGetPayload<{ include: typeof TES_INCLUDE }>
): TesoreriaMovimiento {
  return {
    id: row.id,
    fecha: ymd(row.fecha),
    tipo: row.tipo as TesoreriaMovimiento["tipo"],
    categoria_id: row.categoriaId,
    casa_id: row.casaId,
    reserva_id: row.reservaId,
    concepto: row.concepto,
    monto: Number(row.monto),
    metodo_pago: row.metodoPago as TesoreriaMovimiento["metodo_pago"],
    comprobante: row.comprobante,
    notas: row.notas,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    tesoreria_categorias: row.categoria
      ? {
          id: row.categoria.id,
          nombre: row.categoria.nombre,
          tipo: row.categoria.tipo as TesoreriaCat["tipo"],
          icono: row.categoria.icono,
        }
      : null,
    casas: row.casa,
    reservas: row.reserva
      ? {
          id: row.reserva.id,
          nombre: row.reserva.nombre,
          apellido: row.reserva.apellido,
        }
      : null,
  };
}

export async function getTesoreriaCategorias(): Promise<TesoreriaCat[]> {
  if (!hasDb()) return [];
  try {
    const rows = await prisma.tesoreriaCategoria.findMany({ orderBy: { nombre: "asc" } });
    return rows.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo as TesoreriaCat["tipo"],
      icono: c.icono,
    }));
  } catch {
    return [];
  }
}

export async function getTesoreriaMovimientos(
  filtros: TesoreriaFiltros = {}
): Promise<{ data: TesoreriaMovimiento[]; count: number }> {
  const empty = { data: [] as TesoreriaMovimiento[], count: 0 };
  if (!hasDb()) return empty;

  const {
    tipo,
    casaId,
    categoriaId,
    metodoPago,
    fechaDesde,
    fechaHasta,
    busqueda,
    page = 1,
    pageSize = 20,
  } = filtros;

  const fechaWhere =
    fechaDesde || fechaHasta
      ? {
          fecha: {
            ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
            ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
          },
        }
      : {};

  const where: Prisma.TesoreriaMovimientoWhereInput = {
    ...(tipo ? { tipo } : {}),
    ...(casaId ? { casaId } : {}),
    ...(categoriaId ? { categoriaId } : {}),
    ...(metodoPago ? { metodoPago } : {}),
    ...fechaWhere,
    ...(busqueda?.trim() ? { concepto: { contains: busqueda.trim(), mode: "insensitive" } } : {}),
  };

  try {
    const skip = (page - 1) * pageSize;
    const [rows, count] = await Promise.all([
      prisma.tesoreriaMovimiento.findMany({
        where,
        include: TES_INCLUDE,
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.tesoreriaMovimiento.count({ where }),
    ]);
    return { data: rows.map(mapTesoreriaMov), count };
  } catch {
    return empty;
  }
}

export async function getTesoreriaMovimientosSinPaginar(
  filtros: Omit<TesoreriaFiltros, "page" | "pageSize"> = {}
): Promise<TesoreriaMovimiento[]> {
  if (!hasDb()) return [];
  const { tipo, casaId, categoriaId, metodoPago, fechaDesde, fechaHasta, busqueda } = filtros;
  const fechaWhere =
    fechaDesde || fechaHasta
      ? {
          fecha: {
            ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
            ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
          },
        }
      : {};
  const where: Prisma.TesoreriaMovimientoWhereInput = {
    ...(tipo ? { tipo } : {}),
    ...(casaId ? { casaId } : {}),
    ...(categoriaId ? { categoriaId } : {}),
    ...(metodoPago ? { metodoPago } : {}),
    ...fechaWhere,
    ...(busqueda?.trim() ? { concepto: { contains: busqueda.trim(), mode: "insensitive" } } : {}),
  };
  try {
    const rows = await prisma.tesoreriaMovimiento.findMany({
      where,
      include: TES_INCLUDE,
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      take: 10000,
    });
    return rows.map(mapTesoreriaMov);
  } catch {
    return [];
  }
}

export async function getTesoreriaStats(): Promise<TesoreriaStats> {
  const zero: TesoreriaStats = {
    totalIngresos: 0,
    totalEgresos: 0,
    balance: 0,
    cantMovimientos: 0,
    ingresosMes: 0,
    egresosMes: 0,
    balanceMes: 0,
  };
  if (!hasDb()) return zero;

  try {
    const todos = await prisma.tesoreriaMovimiento.findMany({
      select: { tipo: true, monto: true, fecha: true },
    });

    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const hoyStr = ymd(hoy);

    const sum = (arr: typeof todos, t: string) =>
      arr.filter((m) => m.tipo === t).reduce((acc, m) => acc + Number(m.monto), 0);

    const mes = todos.filter((m) => m.fecha >= primerDiaMes && ymd(m.fecha) <= hoyStr);

    return {
      totalIngresos: sum(todos, "ingreso"),
      totalEgresos: sum(todos, "egreso"),
      balance: sum(todos, "ingreso") - sum(todos, "egreso"),
      cantMovimientos: todos.length,
      ingresosMes: sum(mes, "ingreso"),
      egresosMes: sum(mes, "egreso"),
      balanceMes: sum(mes, "ingreso") - sum(mes, "egreso"),
    };
  } catch {
    return zero;
  }
}

export async function getTesoreriaMovimientoById(id: string): Promise<TesoreriaMovimiento | null> {
  if (!hasDb()) return null;
  try {
    const row = await prisma.tesoreriaMovimiento.findUnique({
      where: { id },
      include: TES_INCLUDE,
    });
    return row ? mapTesoreriaMov(row) : null;
  } catch {
    return null;
  }
}

export type TesoreriaMovimientoInsert = Omit<
  TesoreriaMovimiento,
  "id" | "created_at" | "updated_at" | "tesoreria_categorias" | "casas" | "reservas"
>;

export async function createTesoreriaMovimiento(mov: TesoreriaMovimientoInsert): Promise<TesoreriaMovimiento> {
  const row = await prisma.tesoreriaMovimiento.create({
    data: {
      fecha: new Date(mov.fecha),
      tipo: mov.tipo,
      categoriaId: mov.categoria_id ?? null,
      casaId: mov.casa_id ?? null,
      reservaId: mov.reserva_id ?? null,
      concepto: mov.concepto,
      monto: mov.monto,
      metodoPago: mov.metodo_pago,
      comprobante: mov.comprobante ?? null,
      notas: mov.notas ?? null,
    },
    include: TES_INCLUDE,
  });
  return mapTesoreriaMov(row);
}

export async function updateTesoreriaMovimiento(id: string, mov: Partial<TesoreriaMovimiento>): Promise<void> {
  const data: Prisma.TesoreriaMovimientoUpdateInput = {};
  if (mov.fecha !== undefined) data.fecha = new Date(mov.fecha);
  if (mov.tipo !== undefined) data.tipo = mov.tipo;
  if (mov.categoria_id !== undefined)
    data.categoria = mov.categoria_id ? { connect: { id: mov.categoria_id } } : { disconnect: true };
  if (mov.casa_id !== undefined)
    data.casa = mov.casa_id ? { connect: { id: mov.casa_id } } : { disconnect: true };
  if (mov.reserva_id !== undefined)
    data.reserva = mov.reserva_id ? { connect: { id: mov.reserva_id } } : { disconnect: true };
  if (mov.concepto !== undefined) data.concepto = mov.concepto;
  if (mov.monto !== undefined) data.monto = mov.monto;
  if (mov.metodo_pago !== undefined) data.metodoPago = mov.metodo_pago;
  if (mov.comprobante !== undefined) data.comprobante = mov.comprobante;
  if (mov.notas !== undefined) data.notas = mov.notas;
  await prisma.tesoreriaMovimiento.update({ where: { id }, data });
}

export async function deleteTesoreriaMovimiento(id: string): Promise<void> {
  await prisma.tesoreriaMovimiento.delete({ where: { id } });
}

export async function getAllTesoreriaMovimientos(
  filtros: Omit<TesoreriaFiltros, "page" | "pageSize"> = {}
): Promise<TesoreriaMovimiento[]> {
  return getTesoreriaMovimientosSinPaginar(filtros);
}

export async function getReservasPorCasaParaTesoreria(
  casaId: string
): Promise<{ id: string; nombre: string | null; apellido: string | null }[]> {
  if (!hasDb() || !casaId) return [];
  try {
    const rows = await prisma.reserva.findMany({
      where: { casaId },
      select: { id: true, nombre: true, apellido: true },
      orderBy: { fechaDesde: "desc" },
      take: 200,
    });
    return rows;
  } catch {
    return [];
  }
}
