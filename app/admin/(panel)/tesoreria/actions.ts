"use server";

import { revalidatePath } from "next/cache";
import {
  createTesoreriaMovimiento,
  deleteTesoreriaMovimiento,
  getAllTesoreriaMovimientos,
  getReservasPorCasaParaTesoreria,
  updateTesoreriaMovimiento,
  type TesoreriaMovimientoInsert,
} from "@/lib/queries";
import type { TesoreriaFiltros, TesoreriaMovimiento } from "@/types";

const PATH = "/admin/tesoreria";

export async function crearMovimiento(data: TesoreriaMovimientoInsert) {
  try {
    await createTesoreriaMovimiento(data);
    revalidatePath(PATH);
    revalidatePath("/admin/dashboard");
    return { ok: true as const };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg };
  }
}

export async function editarMovimiento(id: string, data: Partial<TesoreriaMovimientoInsert>) {
  try {
    await updateTesoreriaMovimiento(id, data as Partial<TesoreriaMovimiento>);
    revalidatePath(PATH);
    revalidatePath("/admin/dashboard");
    return { ok: true as const };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg };
  }
}

export async function eliminarMovimiento(id: string) {
  try {
    await deleteTesoreriaMovimiento(id);
    revalidatePath(PATH);
    revalidatePath("/admin/dashboard");
    return { ok: true as const };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg };
  }
}

export async function listarReservasPorCasa(casaId: string) {
  try {
    const rows = await getReservasPorCasaParaTesoreria(casaId);
    return { ok: true as const, rows };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false as const, error: msg, rows: [] };
  }
}

export async function exportarTesoreriaMovimientosAccion(
  filtros: Omit<TesoreriaFiltros, "page" | "pageSize">
): Promise<{ ok: true; items: TesoreriaMovimiento[] } | { ok: false; error: string; items: [] }> {
  try {
    const items = await getAllTesoreriaMovimientos(filtros);
    return { ok: true, items };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error: msg, items: [] };
  }
}
