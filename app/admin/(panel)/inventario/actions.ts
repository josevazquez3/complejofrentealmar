"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  createInventarioCategoria,
  createInventarioItem,
  deleteInventarioCategoria,
  deleteInventarioItem,
  getAllInventarioItemsForExport,
  getInventarioItemById,
  registrarMovimiento,
  updateInventarioCategoria,
  updateInventarioItem,
  type InventarioItemInsert,
} from "@/lib/queries";
import { getServerUser } from "@/lib/auth";
import { normalizeInventarioCategoriaIcono } from "@/lib/inventario-categoria-icons";
import type { InventarioItem, TipoMovimiento } from "@/types";

async function requireInventarioSession() {
  const u = await getServerUser();
  if (!u) throw new Error("No autorizado");
  return u;
}

function prismaUniqueMessage(e: unknown): string | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return "Ya existe una categoría con ese nombre.";
  }
  return null;
}

export async function crearItem(data: InventarioItemInsert) {
  try {
    await createInventarioItem(data);
    revalidatePath("/admin/inventario");
    revalidatePath("/admin/dashboard");
    return { ok: true as const };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg };
  }
}

export async function editarItem(id: string, data: Partial<InventarioItemInsert>) {
  try {
    await updateInventarioItem(id, data as Partial<InventarioItem>);
    revalidatePath("/admin/inventario");
    revalidatePath("/admin/dashboard");
    return { ok: true as const };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg };
  }
}

export async function darDeBajaItem(id: string) {
  try {
    await deleteInventarioItem(id);
    revalidatePath("/admin/inventario");
    revalidatePath("/admin/dashboard");
    return { ok: true as const };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg };
  }
}

export async function moverStock(
  itemId: string,
  tipo: TipoMovimiento,
  cantidad: number,
  motivo?: string
) {
  try {
    const item = await getInventarioItemById(itemId);
    if (!item) throw new Error("Item no encontrado");

    let nueva = item.cantidad;
    if (tipo === "entrada") nueva += cantidad;
    if (tipo === "salida") nueva -= cantidad;
    if (tipo === "ajuste") nueva = cantidad;
    if (tipo === "baja") nueva -= cantidad;

    if (nueva < 0) throw new Error("Stock no puede ser negativo");

    const cantidadRegistro =
      tipo === "ajuste" ? Math.abs(item.cantidad - nueva) : cantidad;

    await updateInventarioItem(itemId, { cantidad: nueva });
    await registrarMovimiento({
      item_id: itemId,
      tipo,
      cantidad: Math.max(0, cantidadRegistro),
      cantidad_anterior: item.cantidad,
      cantidad_nueva: nueva,
      motivo,
    });
    revalidatePath("/admin/inventario");
    revalidatePath("/admin/dashboard");
    return { ok: true as const, nuevaCantidad: nueva };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg };
  }
}

export async function obtenerItemConMovimientos(id: string) {
  try {
    const data = await getInventarioItemById(id);
    return { ok: true as const, data };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg, data: null };
  }
}

export async function exportarInventarioItemsAccion(): Promise<
  | { ok: true; items: InventarioItem[] }
  | { ok: false; error: string; items: InventarioItem[] }
> {
  try {
    const items = await getAllInventarioItemsForExport();
    return { ok: true, items };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error: msg, items: [] };
  }
}

export async function crearCategoriaInventarioAccion(data: { nombre: string; icono?: string | null }) {
  try {
    await requireInventarioSession();
    const icono = normalizeInventarioCategoriaIcono(data.icono ?? null);
    await createInventarioCategoria({ nombre: data.nombre, icono });
    revalidatePath("/admin/inventario");
    revalidatePath("/admin/inventario/categorias");
    return { ok: true as const };
  } catch (e: unknown) {
    const dup = prismaUniqueMessage(e);
    if (dup) return { ok: false as const, error: dup };
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg };
  }
}

export async function editarCategoriaInventarioAccion(
  id: string,
  data: { nombre?: string; icono?: string | null }
) {
  try {
    await requireInventarioSession();
    const payload: { nombre?: string; icono?: string | null } = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre;
    if (data.icono !== undefined) payload.icono = normalizeInventarioCategoriaIcono(data.icono);
    await updateInventarioCategoria(id, payload);
    revalidatePath("/admin/inventario");
    revalidatePath("/admin/inventario/categorias");
    return { ok: true as const };
  } catch (e: unknown) {
    const dup = prismaUniqueMessage(e);
    if (dup) return { ok: false as const, error: dup };
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg };
  }
}

export async function eliminarCategoriaInventarioAccion(id: string) {
  try {
    await requireInventarioSession();
    await deleteInventarioCategoria(id);
    revalidatePath("/admin/inventario");
    revalidatePath("/admin/inventario/categorias");
    return { ok: true as const };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg };
  }
}
