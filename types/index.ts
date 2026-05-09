/** Tipos de dominio y filas alineadas con Prisma / PostgreSQL. */

export type {
  CarouselImage,
  InicioConfig,
  SeccionTexto,
  SeccionTextoId,
  Unidad,
} from "./configuracion";

export type EstadoInventario = "Bueno" | "Roto" | "Faltante" | "Baja";

export interface Casa {
  id: string;
  nombre: string;
  descripcion: string | null;
  capacidad_personas: number;
  fotos: string[] | null;
  activa: boolean | null;
  created_at: string;
  /** Campos opcionales si existen en la BD */
  descripcion_corta?: string | null;
  precio_noche?: number | null;
  ambientes?: number | null;
  banos?: number | null;
  lugares_cochera?: number | null;
  equipamiento?: string[] | null;
  tiene_wifi?: boolean | null;
}

/** Fila mínima para listados (otras unidades, cards). */
export type CasaListItem = Pick<Casa, "id" | "nombre" | "descripcion" | "fotos">;

export type EstadoReserva = "pendiente" | "confirmada" | "cancelada";

export interface Reserva {
  id: string;
  casa_id: string;
  fecha_desde: string;
  fecha_hasta: string;
  adultos: number;
  ninos: number;
  mascotas: number | null;
  comprobante_url: string | null;
  saldo_reserva: number | null;
  created_at: string;
  nombre?: string | null;
  apellido?: string | null;
  email?: string | null;
  telefono?: string | null;
  mensaje?: string | null;
  estado?: EstadoReserva | null;
  noches?: number | null;
}

/** Payload para solicitud pública (sin noches: lo calcula la BD). */
export interface ReservaInsert {
  casa_id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha_desde: string;
  fecha_hasta: string;
  adultos: number;
  ninos: number;
  mascotas: number;
  mensaje?: string;
}

/** Rangos ocupados (pendiente o confirmada) para calendario. */
export interface FechaBloqueada {
  fecha_desde: string;
  fecha_hasta: string;
}

export interface ReservaConCasa extends Reserva {
  casas: Pick<Casa, "id" | "nombre" | "capacidad_personas"> | null;
}

export interface ReservaAdmin extends Reserva {
  casas: {
    id: string;
    nombre: string;
  } | null;
}

export type FiltroEstado = "todos" | EstadoReserva;
export type FiltroOrden = "recientes" | "proximas" | "antiguas";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export interface InventarioRow {
  id: string;
  casa_id: string;
  elemento: string;
  descripcion: string | null;
  cantidad: number | null;
  estado: EstadoInventario | null;
  created_at: string;
}

export interface InventarioConCasa extends InventarioRow {
  casas: Pick<Casa, "nombre"> | null;
}

/** Inventario admin (tablas inventario_*) */
export type EstadoItem = "bueno" | "regular" | "malo" | "dado_de_baja";
export type TipoMovimiento = "entrada" | "salida" | "ajuste" | "baja";
export type UnidadItem = "unidad" | "juego" | "par" | "set" | "rollo" | "litro";

export interface InventarioCategoria {
  id: string;
  nombre: string;
  icono?: string | null;
  created_at: string;
}

export type InventarioCategoriaConConteo = InventarioCategoria & { items_count: number };

export interface InventarioItem {
  id: string;
  casa_id: string;
  categoria_id?: string | null;
  nombre: string;
  descripcion?: string | null;
  cantidad: number;
  cantidad_min: number;
  unidad: UnidadItem;
  estado: EstadoItem;
  ubicacion?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  inventario_categorias?: InventarioCategoria | null;
  casas?: { id: string; nombre: string } | null;
}

export interface InventarioMovimiento {
  id: string;
  item_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo?: string | null;
  created_at: string;
}

export interface InventarioItemConMovimientos extends InventarioItem {
  inventario_movimientos: InventarioMovimiento[];
}

export interface InventarioStats {
  totalItems: number;
  itemsStockBajo: number;
  itemsMalEstado: number;
  totalCasas: number;
}

export interface TesoreriaRow {
  id: string;
  casa_id: string | null;
  reserva_id: string | null;
  diferencia: number | null;
  comprobante_url: string | null;
  saldo: number | null;
  created_at: string;
}

export interface TesoreriaConRelaciones extends TesoreriaRow {
  casas: Pick<Casa, "nombre"> | null;
  reservas: Pick<Reserva, "fecha_desde" | "fecha_hasta"> | null;
}

/** Tesorería admin (tablas tesoreria_categorias / tesoreria_movimientos) */
export type TipoMovimientoTes = "ingreso" | "egreso";
export type MetodoPago = "efectivo" | "transferencia" | "tarjeta" | "cheque" | "otro";

export interface TesoreriaCat {
  id: string;
  nombre: string;
  tipo: "ingreso" | "egreso" | "ambos";
  icono?: string | null;
}

export interface TesoreriaMovimiento {
  id: string;
  fecha: string;
  tipo: TipoMovimientoTes;
  categoria_id?: string | null;
  casa_id?: string | null;
  reserva_id?: string | null;
  concepto: string;
  monto: number;
  metodo_pago: MetodoPago;
  comprobante?: string | null;
  notas?: string | null;
  created_at: string;
  updated_at: string;
  tesoreria_categorias?: TesoreriaCat | null;
  casas?: { id: string; nombre: string } | null;
  reservas?: { id: string; nombre: string | null; apellido: string | null } | null;
}

export interface TesoreriaStats {
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  cantMovimientos: number;
  ingresosMes: number;
  egresosMes: number;
  balanceMes: number;
}

export interface TesoreriaFiltros {
  tipo?: TipoMovimientoTes;
  casaId?: string;
  categoriaId?: string;
  metodoPago?: MetodoPago;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
  page?: number;
  pageSize?: number;
}

export interface Configuracion {
  id: string;
  complejo_nombre: string;
  tagline: string | null;
  descripcion_home: string | null;
  ubicacion_direccion: string | null;
  mapa_query: string | null;
  /** Plantilla mensaje confirmación (placeholders {nombre}, {complejo}, …). Vacío = default en runtime. */
  whatsapp_mensaje: string;
  /** WhatsApp solo dígitos (código país). Sitio público y confirmación wa.me en panel admin. */
  whatsapp_e164: string | null;
  email_contacto: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  /** ID del video institucional (YouTube), editable en Editar sitio → Video. */
  youtube_video_id: string | null;
  /** URL del logo en el header (opcional). */
  logo_url: string | null;
  whatsapp_mensaje_publico: string;
  updated_at: string;
}

export interface DashboardStats {
  reservasMes: number;
  casasActivas: number;
}

/** Lista desplegable de reservas (admin tesorería). */
export interface ReservaListaItem {
  id: string;
  fecha_desde: string;
  fecha_hasta: string;
  casas: Pick<Casa, "nombre"> | null;
}
