"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reservas")
      .select("*, casas(id, nombre, capacidad_personas)")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as ReservaConCasa[];
  } catch {
    return [];
  }
}

export async function cambiarEstadoReserva(
  id: string,
  estado: EstadoReserva
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await updateEstadoReserva(id, estado);
    revalidatePath("/admin/reservas");
    revalidatePath("/admin/dashboard");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo cambiar el estado." };
  }
}

export async function eliminarReservaAdmin(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await deleteReserva(id);
    revalidatePath("/admin/reservas");
    revalidatePath("/admin/dashboard");
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

async function uploadComprobante(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reservaId: string,
  file: File
): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("El archivo supera 5 MB");
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["jpg", "jpeg", "pdf"].includes(ext)) {
    throw new Error("Solo se permiten .jpg, .jpeg o .pdf");
  }
  const path = `comprobantes/${reservaId}_${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from("archivos").upload(path, buf, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function crearReserva(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
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

    const { data: casa, error: casaErr } = await supabase
      .from("casas")
      .select("capacidad_personas")
      .eq("id", casa_id)
      .single();
    if (casaErr || !casa) return { success: false, error: "Casa no encontrada." };
    if (cant_personas > casa.capacidad_personas) {
      return {
        success: false,
        error: `Máximo ${casa.capacidad_personas} personas para esta casa.`,
      };
    }

    const { data: inserted, error: insErr } = await supabase
      .from("reservas")
      .insert({
        casa_id,
        fecha_desde,
        fecha_hasta,
        cant_personas,
        mascotas,
        saldo_reserva,
        comprobante_url: null,
        estado: "confirmada",
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      return { success: false, error: insErr?.message ?? "No se pudo crear la reserva." };
    }

    if (fileEntry instanceof File && fileEntry.size > 0) {
      try {
        const path = await uploadComprobante(supabase, inserted.id, fileEntry);
        await supabase.from("reservas").update({ comprobante_url: path }).eq("id", inserted.id);
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

    const supabase = await createClient();
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

    const { data: casa, error: casaErr } = await supabase
      .from("casas")
      .select("capacidad_personas")
      .eq("id", casa_id)
      .single();
    if (casaErr || !casa) return { success: false, error: "Casa no encontrada." };
    if (cant_personas > casa.capacidad_personas) {
      return {
        success: false,
        error: `Máximo ${casa.capacidad_personas} personas para esta casa.`,
      };
    }

    let comprobante_url: string | null | undefined = undefined;
    if (fileEntry instanceof File && fileEntry.size > 0) {
      try {
        comprobante_url = await uploadComprobante(supabase, id, fileEntry);
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : "Error al subir el comprobante.",
        };
      }
    } else if (!keepComprobante) {
      comprobante_url = null;
    }

    const updatePayload: Record<string, unknown> = {
      casa_id,
      fecha_desde,
      fecha_hasta,
      cant_personas,
      mascotas: Number.isFinite(mascotasVal) ? mascotasVal : 0,
      saldo_reserva,
    };
    if (comprobante_url !== undefined) {
      updatePayload.comprobante_url = comprobante_url;
    }

    const { error: upErr } = await supabase.from("reservas").update(updatePayload).eq("id", id);
    if (upErr) return { success: false, error: upErr.message };

    revalidatePath("/admin/reservas");
    revalidatePath("/admin/tesoreria");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function eliminarReserva(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("reservas").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/reservas");
    revalidatePath("/admin/tesoreria");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
