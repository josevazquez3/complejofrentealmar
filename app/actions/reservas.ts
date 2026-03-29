"use server";

import { revalidatePath } from "next/cache";
import { getCasaById, getFechasBloqueadas, insertarReserva } from "@/lib/queries";
import { rangoSolapaBloqueados } from "@/lib/reservas-disponibilidad";
import type { ReservaInsert } from "@/types";

function todayYmd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function crearReserva(data: ReservaInsert): Promise<
  | { ok: true; id: string }
  | { ok: false; error: string }
> {
  try {
    if (!data.casa_id?.trim()) return { ok: false, error: "Falta la unidad." };
    if (!data.nombre?.trim() || !data.apellido?.trim()) return { ok: false, error: "Completá nombre y apellido." };
    if (!data.email?.trim() || !data.telefono?.trim()) return { ok: false, error: "Completá email y teléfono." };
    if (!data.fecha_desde || !data.fecha_hasta) return { ok: false, error: "Elegí las fechas." };
    if (data.fecha_hasta <= data.fecha_desde) {
      return { ok: false, error: "La fecha de salida debe ser posterior al ingreso." };
    }
    if (todayYmd() > data.fecha_desde) {
      return { ok: false, error: "La fecha de ingreso no puede ser anterior a hoy." };
    }
    if (!Number.isFinite(data.personas) || data.personas < 1) {
      return { ok: false, error: "Cantidad de personas inválida." };
    }

    const casa = await getCasaById(data.casa_id);
    if (!casa) return { ok: false, error: "Unidad no encontrada." };
    if (data.personas > casa.capacidad_personas) {
      return { ok: false, error: `Máximo ${casa.capacidad_personas} personas para esta unidad.` };
    }

    const bloqueados = await getFechasBloqueadas(data.casa_id);
    if (rangoSolapaBloqueados(data.fecha_desde, data.fecha_hasta, bloqueados)) {
      return { ok: false, error: "Esas fechas ya no están disponibles. Elegí otro rango." };
    }

    const reserva = await insertarReserva(data, "pendiente");
    revalidatePath(`/casas/${data.casa_id}`);
    revalidatePath("/reservas");
    return { ok: true, id: reserva.id };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "No se pudo registrar la solicitud.";
    return { ok: false, error: msg };
  }
}
