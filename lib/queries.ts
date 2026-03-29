import { cache } from "react";
import { createClient } from "./supabase/server";
import type {
  Casa,
  CasaListItem,
  Configuracion,
  EstadoItem,
  EstadoReserva,
  FechaBloqueada,
  InventarioCategoria,
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
import { env } from "@/lib/env";

function hasSupabaseEnv(): boolean {
  return Boolean(env.supabaseUrl.length && env.supabaseAnonKey.length);
}

export const getConfiguracion = cache(async (): Promise<Configuracion | null> => {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("configuracion")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data as Configuracion | null;
  } catch {
    return null;
  }
});

export type CasasLoadResult = { casas: Casa[]; failed: boolean };

export const getCasasActivasForHome = cache(async (): Promise<CasasLoadResult> => {
  if (!hasSupabaseEnv()) return { casas: [], failed: false };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("casas")
      .select("*")
      .eq("activa", true)
      .order("nombre");
    if (error) return { casas: [], failed: true };
    return { casas: (data ?? []) as Casa[], failed: false };
  } catch {
    return { casas: [], failed: true };
  }
});

export const getCasasActivas = cache(async (): Promise<Casa[]> => {
  const { casas } = await getCasasActivasForHome();
  return casas;
});

export const getCasaById = cache(async (id: string): Promise<Casa | null> => {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("casas")
      .select("*")
      .eq("id", id)
      .eq("activa", true)
      .maybeSingle();
    if (error) return null;
    return data as Casa | null;
  } catch {
    return null;
  }
});

/** Otras unidades activas para la página de detalle (excluye la actual). */
export const getOtrasCasas = cache(async (excludeId: string): Promise<CasaListItem[]> => {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("casas")
      .select("id, nombre, descripcion, fotos")
      .neq("id", excludeId)
      .eq("activa", true)
      .order("nombre")
      .limit(3);
    if (error) return [];
    return (data ?? []) as CasaListItem[];
  } catch {
    return [];
  }
});

/** URLs para el carrusel hero (fotos de todas las casas activas). */
export async function getHeroImageUrls(): Promise<string[]> {
  const casas = await getCasasActivas();
  const urls = casas.flatMap((c) => c.fotos ?? []).filter(Boolean);
  return Array.from(new Set(urls));
}

/** Casas activas para el flujo público de reservas. */
export const getCasasParaReservas = cache(async (): Promise<Casa[]> => {
  const { casas } = await getCasasActivasForHome();
  return casas;
});

/** Rangos ocupados (pendiente o confirmada) vía RPC — no expone datos sensibles. */
export async function getFechasBloqueadas(casaId: string): Promise<FechaBloqueada[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_fechas_bloqueadas", {
      p_casa_id: casaId,
    });
    if (error) return [];
    const rows = (data ?? []) as { fecha_desde: string; fecha_hasta: string }[];
    return rows.map((r) => ({
      fecha_desde: String(r.fecha_desde).slice(0, 10),
      fecha_hasta: String(r.fecha_hasta).slice(0, 10),
    }));
  } catch {
    return [];
  }
}

export async function insertarReserva(
  reserva: ReservaInsert,
  estado: EstadoReserva = "pendiente"
): Promise<Reserva> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservas")
    .insert({
      casa_id: reserva.casa_id,
      nombre: reserva.nombre,
      apellido: reserva.apellido,
      email: reserva.email,
      telefono: reserva.telefono,
      fecha_desde: reserva.fecha_desde,
      fecha_hasta: reserva.fecha_hasta,
      cant_personas: reserva.personas,
      mensaje: reserva.mensaje ?? null,
      mascotas: 0,
      estado,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Reserva;
}

const RESERVAS_PAGE_SIZE = 10;

export async function getReservasAdminPage(
  page: number
): Promise<{ rows: ReservaConCasa[]; total: number; pageSize: number }> {
  const pageSize = RESERVAS_PAGE_SIZE;
  const safePage = Math.max(1, page);
  if (!hasSupabaseEnv()) {
    return { rows: [], total: 0, pageSize };
  }
  try {
    const supabase = await createClient();
    const from = (safePage - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from("reservas")
      .select("*, casas(id, nombre, capacidad_personas)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) {
      return { rows: [], total: 0, pageSize };
    }
    return {
      rows: (data ?? []) as ReservaConCasa[],
      total: count ?? 0,
      pageSize,
    };
  } catch {
    return { rows: [], total: 0, pageSize };
  }
}

export async function getReservasAdmin(): Promise<ReservaAdmin[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservas")
    .select("*, casas(id, nombre)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReservaAdmin[];
}

export async function getReservaById(id: string): Promise<ReservaAdmin | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reservas")
    .select("*, casas(id, nombre)")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return (data ?? null) as ReservaAdmin | null;
}

export async function updateEstadoReserva(id: string, estado: EstadoReserva): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("reservas").update({ estado }).eq("id", id);
  if (error) throw error;
}

export async function deleteReserva(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("reservas").delete().eq("id", id);
  if (error) throw error;
}

const INVENTARIO_SELECT = `
  *,
  inventario_categorias(id, nombre, icono),
  casas(id, nombre)
`;

export async function getCategorias(): Promise<InventarioCategoria[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("inventario_categorias")
      .select("*")
      .order("nombre");
    if (error) return [];
    return (data ?? []) as InventarioCategoria[];
  } catch {
    return [];
  }
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

  if (!hasSupabaseEnv()) {
    return { data: [], count: 0 };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("inventario_items")
      .select(INVENTARIO_SELECT, { count: "exact" })
      .eq("activo", true)
      .order("nombre");

    if (casaId) query = query.eq("casa_id", casaId);
    if (categoriaId) query = query.eq("categoria_id", categoriaId);
    if (estado) query = query.eq("estado", estado);
    if (busqueda?.trim()) query = query.ilike("nombre", `%${busqueda.trim()}%`);

    if (soloStockBajo) {
      const { data: raw, error } = await query;
      if (error) throw error;
      const rows = (raw ?? []) as InventarioItem[];
      const filtered = rows.filter((i) => i.cantidad <= i.cantidad_min);
      const from = (page - 1) * pageSize;
      return {
        data: filtered.slice(from, from + pageSize),
        count: filtered.length,
      };
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    return { data: (data ?? []) as InventarioItem[], count: count ?? 0 };
  } catch {
    return { data: [], count: 0 };
  }
}

/** Listado sin paginar (vista por unidad / export). */
export async function getInventarioItemsSinPaginar(params: {
  casaId?: string;
  categoriaId?: string;
  estado?: EstadoItem;
  busqueda?: string;
}): Promise<InventarioItem[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = await createClient();
    let query = supabase
      .from("inventario_items")
      .select(INVENTARIO_SELECT)
      .eq("activo", true)
      .order("nombre");

    const { casaId, categoriaId, estado, busqueda } = params;
    if (casaId) query = query.eq("casa_id", casaId);
    if (categoriaId) query = query.eq("categoria_id", categoriaId);
    if (estado) query = query.eq("estado", estado);
    if (busqueda?.trim()) query = query.ilike("nombre", `%${busqueda.trim()}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as InventarioItem[];
  } catch {
    return [];
  }
}

export async function getInventarioItemById(id: string): Promise<InventarioItemConMovimientos | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("inventario_items")
    .select(
      `
      *,
      inventario_categorias(id, nombre, icono),
      casas(id, nombre)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !row) return null;

  const { data: movs } = await supabase
    .from("inventario_movimientos")
    .select("*")
    .eq("item_id", id)
    .order("created_at", { ascending: false });

  return {
    ...(row as InventarioItem),
    inventario_movimientos: (movs ?? []) as InventarioItemConMovimientos["inventario_movimientos"],
  };
}

export type InventarioItemInsert = Omit<
  InventarioItem,
  "id" | "created_at" | "updated_at" | "inventario_categorias" | "casas"
>;

export async function createInventarioItem(item: InventarioItemInsert): Promise<InventarioItem> {
  const supabase = await createClient();
  const payload = {
    casa_id: item.casa_id,
    categoria_id: item.categoria_id ?? null,
    nombre: item.nombre,
    descripcion: item.descripcion ?? null,
    cantidad: item.cantidad,
    cantidad_min: item.cantidad_min,
    unidad: item.unidad,
    estado: item.estado,
    ubicacion: item.ubicacion ?? null,
    activo: item.activo,
  };
  const { data, error } = await supabase.from("inventario_items").insert(payload).select().single();
  if (error) throw error;
  return data as InventarioItem;
}

export async function updateInventarioItem(id: string, item: Partial<InventarioItem>): Promise<void> {
  const supabase = await createClient();
  const allowed: Record<string, unknown> = {};
  if (item.casa_id !== undefined) allowed.casa_id = item.casa_id;
  if (item.categoria_id !== undefined) allowed.categoria_id = item.categoria_id;
  if (item.nombre !== undefined) allowed.nombre = item.nombre;
  if (item.descripcion !== undefined) allowed.descripcion = item.descripcion;
  if (item.cantidad !== undefined) allowed.cantidad = item.cantidad;
  if (item.cantidad_min !== undefined) allowed.cantidad_min = item.cantidad_min;
  if (item.unidad !== undefined) allowed.unidad = item.unidad;
  if (item.estado !== undefined) allowed.estado = item.estado;
  if (item.ubicacion !== undefined) allowed.ubicacion = item.ubicacion;
  if (item.activo !== undefined) allowed.activo = item.activo;

  const { error } = await supabase.from("inventario_items").update(allowed).eq("id", id);
  if (error) throw error;
}

export async function deleteInventarioItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("inventario_items").update({ activo: false }).eq("id", id);
  if (error) throw error;
}

export async function registrarMovimiento(mov: {
  item_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("inventario_movimientos").insert({
    item_id: mov.item_id,
    tipo: mov.tipo,
    cantidad: mov.cantidad,
    cantidad_anterior: mov.cantidad_anterior,
    cantidad_nueva: mov.cantidad_nueva,
    motivo: mov.motivo ?? null,
  });
  if (error) throw error;
}

export async function getInventarioStats(): Promise<InventarioStats> {
  const empty: InventarioStats = {
    totalItems: 0,
    itemsStockBajo: 0,
    itemsMalEstado: 0,
    totalCasas: 0,
  };
  if (!hasSupabaseEnv()) return empty;
  try {
    const supabase = await createClient();
    const { data: items, error } = await supabase
      .from("inventario_items")
      .select("cantidad, cantidad_min, estado, casa_id")
      .eq("activo", true);
    if (error) return empty;
    const all = (items ?? []) as {
      cantidad: number;
      cantidad_min: number;
      estado: string;
      casa_id: string;
    }[];
    return {
      totalItems: all.length,
      itemsStockBajo: all.filter((i) => i.cantidad <= i.cantidad_min).length,
      itemsMalEstado: all.filter((i) => ["malo", "dado_de_baja"].includes(i.estado)).length,
      totalCasas: new Set(all.map((i) => i.casa_id)).size,
    };
  } catch {
    return empty;
  }
}

export async function getAllInventarioItemsForExport(): Promise<InventarioItem[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("inventario_items")
      .select(INVENTARIO_SELECT)
      .eq("activo", true)
      .order("nombre");
    if (error) throw error;
    return (data ?? []) as InventarioItem[];
  } catch {
    return [];
  }
}

const TESORERIA_SELECT = `
  *,
  tesoreria_categorias(id, nombre, icono, tipo),
  casas(id, nombre),
  reservas(id, nombre, apellido)
`;

export async function getTesoreriaCategorias(): Promise<TesoreriaCat[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tesoreria_categorias")
      .select("*")
      .order("nombre");
    if (error) return [];
    return (data ?? []) as TesoreriaCat[];
  } catch {
    return [];
  }
}

export async function getTesoreriaMovimientos(
  filtros: TesoreriaFiltros = {}
): Promise<{ data: TesoreriaMovimiento[]; count: number }> {
  const empty = { data: [] as TesoreriaMovimiento[], count: 0 };
  if (!hasSupabaseEnv()) return empty;

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

  try {
    const supabase = await createClient();
    let q = supabase
      .from("tesoreria_movimientos")
      .select(TESORERIA_SELECT, { count: "exact" })
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });

    if (tipo) q = q.eq("tipo", tipo);
    if (casaId) q = q.eq("casa_id", casaId);
    if (categoriaId) q = q.eq("categoria_id", categoriaId);
    if (metodoPago) q = q.eq("metodo_pago", metodoPago);
    if (fechaDesde) q = q.gte("fecha", fechaDesde);
    if (fechaHasta) q = q.lte("fecha", fechaHasta);
    if (busqueda?.trim()) q = q.ilike("concepto", `%${busqueda.trim()}%`);

    const from = (page - 1) * pageSize;
    q = q.range(from, from + pageSize - 1);

    const { data, count, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as TesoreriaMovimiento[];
    return {
      data: rows.map((r) => ({ ...r, monto: Number(r.monto) })),
      count: count ?? 0,
    };
  } catch {
    return empty;
  }
}

export async function getTesoreriaMovimientosSinPaginar(
  filtros: Omit<TesoreriaFiltros, "page" | "pageSize"> = {}
): Promise<TesoreriaMovimiento[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = await createClient();
    const { tipo, casaId, categoriaId, metodoPago, fechaDesde, fechaHasta, busqueda } = filtros;
    let q = supabase
      .from("tesoreria_movimientos")
      .select(TESORERIA_SELECT)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });

    if (tipo) q = q.eq("tipo", tipo);
    if (casaId) q = q.eq("casa_id", casaId);
    if (categoriaId) q = q.eq("categoria_id", categoriaId);
    if (metodoPago) q = q.eq("metodo_pago", metodoPago);
    if (fechaDesde) q = q.gte("fecha", fechaDesde);
    if (fechaHasta) q = q.lte("fecha", fechaHasta);
    if (busqueda?.trim()) q = q.ilike("concepto", `%${busqueda.trim()}%`);
    const { data, error } = await q.limit(10000);
    if (error) throw error;
    return ((data ?? []) as TesoreriaMovimiento[]).map((r) => ({ ...r, monto: Number(r.monto) }));
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
  if (!hasSupabaseEnv()) return zero;

  try {
    const supabase = await createClient();
    const { data: todos, error } = await supabase.from("tesoreria_movimientos").select("tipo, monto, fecha");
    if (error) return zero;

    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
    const hoyStr = hoy.toISOString().slice(0, 10);

    const all = (todos ?? []) as { tipo: string; monto: string | number; fecha: string }[];
    const sum = (arr: typeof all, t: string) =>
      arr.filter((m) => m.tipo === t).reduce((acc, m) => acc + Number(m.monto), 0);

    const mes = all.filter((m) => m.fecha >= primerDiaMes && m.fecha <= hoyStr);

    return {
      totalIngresos: sum(all, "ingreso"),
      totalEgresos: sum(all, "egreso"),
      balance: sum(all, "ingreso") - sum(all, "egreso"),
      cantMovimientos: all.length,
      ingresosMes: sum(mes, "ingreso"),
      egresosMes: sum(mes, "egreso"),
      balanceMes: sum(mes, "ingreso") - sum(mes, "egreso"),
    };
  } catch {
    return zero;
  }
}

export async function getTesoreriaMovimientoById(id: string): Promise<TesoreriaMovimiento | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tesoreria_movimientos")
      .select(TESORERIA_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as TesoreriaMovimiento;
    return { ...row, monto: Number(row.monto) };
  } catch {
    return null;
  }
}

export type TesoreriaMovimientoInsert = Omit<
  TesoreriaMovimiento,
  "id" | "created_at" | "updated_at" | "tesoreria_categorias" | "casas" | "reservas"
>;

export async function createTesoreriaMovimiento(mov: TesoreriaMovimientoInsert): Promise<TesoreriaMovimiento> {
  const supabase = await createClient();
  const payload = {
    fecha: mov.fecha,
    tipo: mov.tipo,
    categoria_id: mov.categoria_id ?? null,
    casa_id: mov.casa_id ?? null,
    reserva_id: mov.reserva_id ?? null,
    concepto: mov.concepto,
    monto: mov.monto,
    metodo_pago: mov.metodo_pago,
    comprobante: mov.comprobante ?? null,
    notas: mov.notas ?? null,
  };
  const { data, error } = await supabase.from("tesoreria_movimientos").insert(payload).select().single();
  if (error) throw error;
  const row = data as TesoreriaMovimiento;
  return { ...row, monto: Number(row.monto) };
}

export async function updateTesoreriaMovimiento(id: string, mov: Partial<TesoreriaMovimiento>): Promise<void> {
  const supabase = await createClient();
  const allowed: Record<string, unknown> = {};
  if (mov.fecha !== undefined) allowed.fecha = mov.fecha;
  if (mov.tipo !== undefined) allowed.tipo = mov.tipo;
  if (mov.categoria_id !== undefined) allowed.categoria_id = mov.categoria_id;
  if (mov.casa_id !== undefined) allowed.casa_id = mov.casa_id;
  if (mov.reserva_id !== undefined) allowed.reserva_id = mov.reserva_id;
  if (mov.concepto !== undefined) allowed.concepto = mov.concepto;
  if (mov.monto !== undefined) allowed.monto = mov.monto;
  if (mov.metodo_pago !== undefined) allowed.metodo_pago = mov.metodo_pago;
  if (mov.comprobante !== undefined) allowed.comprobante = mov.comprobante;
  if (mov.notas !== undefined) allowed.notas = mov.notas;

  const { error } = await supabase.from("tesoreria_movimientos").update(allowed).eq("id", id);
  if (error) throw error;
}

export async function deleteTesoreriaMovimiento(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tesoreria_movimientos").delete().eq("id", id);
  if (error) throw error;
}

export async function getAllTesoreriaMovimientos(
  filtros: Omit<TesoreriaFiltros, "page" | "pageSize"> = {}
): Promise<TesoreriaMovimiento[]> {
  return getTesoreriaMovimientosSinPaginar(filtros);
}

/** Reservas de una casa (selector en movimiento de tesorería). */
export async function getReservasPorCasaParaTesoreria(
  casaId: string
): Promise<{ id: string; nombre: string | null; apellido: string | null }[]> {
  if (!hasSupabaseEnv() || !casaId) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reservas")
      .select("id, nombre, apellido")
      .eq("casa_id", casaId)
      .order("fecha_desde", { ascending: false })
      .limit(200);
    if (error) return [];
    return (data ?? []) as { id: string; nombre: string | null; apellido: string | null }[];
  } catch {
    return [];
  }
}
