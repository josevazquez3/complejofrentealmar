"use server";

import { revalidatePath } from "next/cache";
import { uploadToBlob } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import { parseARSInput } from "@/lib/format";
import { deleteReserva, insertarReserva, updateEstadoReserva } from "@/lib/queries";
import type { ActionResult, EstadoReserva, ReservaConCasa, ReservaInsert } from "@/types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function todayLocalYmd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function fetchReservasForExport(): Promise<ReservaConCasa[]> {
  try {
    const rows = await prisma.reserva.findMany({
      include: {
        casa: { select: { id: true, nombre: true, capacidadPersonas: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      casa_id: row.casaId,
      fecha_desde: row.fechaDesde.toISOString().slice(0, 10),
      fecha_hasta: row.fechaHasta.toISOString().slice(0, 10),
      cant_personas: row.cantPersonas,
      mascotas: row.mascotas,
      comprobante_url: row.comprobanteUrl,
      saldo_reserva: row.saldoReserva != null ? Number(row.saldoReserva) : null,
      created_at: row.createdAt.toISOString(),
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      telefono: row.telefono,
      mensaje: row.mensaje,
      estado: row.estado as ReservaConCasa["estado"],
      noches: Math.max(
        0,
        Math.round((row.fechaHasta.getTime() - row.fechaDesde.getTime()) / 86400000)
      ),
      casas: row.casa
        ? {
            id: row.casa.id,
            nombre: row.casa.nombre,
            capacidad_personas: row.casa.capacidadPersonas,
          }
        : null,
    }));
  } catch {
    return [];
  }
}

export async function cambiarEstadoReserva(
  id: string,
  estado: EstadoReserva
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const row = await prisma.reserva.findUnique({ where: { id }, select: { casaId: true } });
    await updateEstadoReserva(id, estado);
    revalidatePath("/admin/reservas");
    revalidatePath("/admin/dashboard");
    revalidatePath("/reservas");
    if (row?.casaId) revalidatePath(`/casas/${row.casaId}`);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo cambiar el estado." };
  }
}

export async function eliminarReservaAdmin(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const row = await prisma.reserva.findUnique({ where: { id }, select: { casaId: true } });
    await deleteReserva(id);
    revalidatePath("/admin/reservas");
    revalidatePath("/admin/dashboard");
    revalidatePath("/reservas");
    if (row?.casaId) revalidatePath(`/casas/${row.casaId}`);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo eliminar la reserva." };
  }
}

export async function crearReservaAdmin(
  data: ReservaInsert
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await insertarReserva(data, "confirmada");
    revalidatePath("/admin/reservas");
    revalidatePath("/admin/dashboard");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo crear la reserva." };
  }
}

async function uploadComprobanteReserva(reservaId: string, file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("El archivo supera 5 MB");
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["jpg", "jpeg", "pdf"].includes(ext)) {
    throw new Error("Solo se permiten .jpg, .jpeg o .pdf");
  }
  const pathname = `comprobantes/${reservaId}_${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadToBlob(pathname, buf, file.type || "application/octet-stream");
  return url;
}

export async function crearReserva(formData: FormData): Promise<ActionResult> {
  try {
    const casa_id = String(formData.get("casa_id") ?? "").trim();
    const fecha_desde = String(formData.get("fecha_desde") ?? "");
    const fecha_hasta = String(formData.get("fecha_hasta") ?? "");
    const cant_personas = Number.parseInt(String(formData.get("cant_personas") ?? ""), 10);
    const mascotasField = String(formData.get("mascotas") ?? "0");
    const mascotas = mascotasField === "4" ? 4 : Number.parseInt(mascotasField, 10);
    const saldoStr = String(formData.get("saldo_reserva") ?? "");
    const saldo_reserva = saldoStr.trim() ? parseARSInput(saldoStr) : null;
    const fileEntry = formData.get("comprobante");

    if (!casa_id) return { success: false, error: "Elegí una casa." };
    if (!fecha_desde || !fecha_hasta) return { success: false, error: "Completá las fechas." };
    if (fecha_hasta <= fecha_desde) {
      return { success: false, error: "La fecha hasta debe ser posterior a la fecha desde." };
    }
    if (todayLocalYmd() > fecha_desde) {
      return { success: false, error: "La fecha desde no puede ser anterior a hoy." };
    }
    if (!Number.isFinite(cant_personas) || cant_personas < 1) {
      return { success: false, error: "Cantidad de personas inválida." };
    }
    if (!Number.isFinite(mascotas) || mascotas < 0 || mascotas > 4) {
      return { success: false, error: "Mascotas inválido." };
    }

    const casa = await prisma.casa.findFirst({ where: { id: casa_id, activa: true } });
    if (!casa) return { success: false, error: "Casa no encontrada." };
    if (cant_personas > casa.capacidadPersonas) {
      return {
        success: false,
        error: `Máximo ${casa.capacidadPersonas} personas para esta casa.`,
      };
    }

    const inserted = await prisma.reserva.create({
      data: {
        casaId: casa_id,
        fechaDesde: new Date(fecha_desde),
        fechaHasta: new Date(fecha_hasta),
        cantPersonas: cant_personas,
        mascotas,
        saldoReserva: saldo_reserva,
        comprobanteUrl: null,
        estado: "confirmada",
      },
      select: { id: true },
    });

    if (fileEntry instanceof File && fileEntry.size > 0) {
      try {
        const url = await uploadComprobanteReserva(inserted.id, fileEntry);
        await prisma.reserva.update({
          where: { id: inserted.id },
          data: { comprobanteUrl: url },
        });
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Error al subir el comprobante.",
        };
      }
    }

    revalidatePath("/admin/reservas");
    revalidatePath("/admin/tesoreria");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function editarReserva(formData: FormData): Promise<ActionResult> {
  try {
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { success: false, error: "Falta el id de la reserva." };

    const casa_id = String(formData.get("casa_id") ?? "").trim();
    const fecha_desde = String(formData.get("fecha_desde") ?? "");
    const fecha_hasta = String(formData.get("fecha_hasta") ?? "");
    const cant_personas = Number.parseInt(String(formData.get("cant_personas") ?? ""), 10);
    const mascotasField = String(formData.get("mascotas") ?? "0");
    const mascotasVal =
      mascotasField === "4" ? 4 : Number.parseInt(mascotasField, 10);
    const saldoStr = String(formData.get("saldo_reserva") ?? "");
    const saldo_reserva = saldoStr.trim() ? parseARSInput(saldoStr) : null;
    const fileEntry = formData.get("comprobante");
    const keepComprobante = String(formData.get("keep_comprobante") ?? "1") === "1";

    if (!casa_id) return { success: false, error: "Elegí una casa." };
    if (!fecha_desde || !fecha_hasta) return { success: false, error: "Completá las fechas." };
    if (fecha_hasta <= fecha_desde) {
      return { success: false, error: "La fecha hasta debe ser posterior a la fecha desde." };
    }
    if (!Number.isFinite(cant_personas) || cant_personas < 1) {
      return { success: false, error: "Cantidad de personas inválida." };
    }
    if (!Number.isFinite(mascotasVal) || mascotasVal < 0 || mascotasVal > 4) {
      return { success: false, error: "Mascotas inválido." };
    }

    const casa = await prisma.casa.findFirst({ where: { id: casa_id, activa: true } });
    if (!casa) return { success: false, error: "Casa no encontrada." };
    if (cant_personas > casa.capacidadPersonas) {
      return {
        success: false,
        error: `Máximo ${casa.capacidadPersonas} personas para esta casa.`,
      };
    }

    let comprobante_url: string | null | undefined = undefined;
    if (fileEntry instanceof File && fileEntry.size > 0) {
      try {
        comprobante_url = await uploadComprobanteReserva(id, fileEntry);
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Error al subir el comprobante.",
        };
      }
    } else if (!keepComprobante) {
      comprobante_url = null;
    }

    await prisma.reserva.update({
      where: { id },
      data: {
        casaId: casa_id,
        fechaDesde: new Date(fecha_desde),
        fechaHasta: new Date(fecha_hasta),
        cantPersonas: cant_personas,
        mascotas: Number.isFinite(mascotasVal) ? mascotasVal : 0,
        saldoReserva: saldo_reserva,
        ...(comprobante_url !== undefined ? { comprobanteUrl: comprobante_url } : {}),
      },
    });

    revalidatePath("/admin/reservas");
    revalidatePath("/admin/tesoreria");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function eliminarReserva(id: string): Promise<ActionResult> {
  try {
    await deleteReserva(id);
    revalidatePath("/admin/reservas");
    revalidatePath("/admin/tesoreria");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
