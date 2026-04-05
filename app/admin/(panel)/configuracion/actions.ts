"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

function configuracionFromForm(formData: FormData) {
  const complejoNombre = String(formData.get("complejo_nombre") ?? "").trim();
  return {
    complejoNombre,
    tagline: String(formData.get("tagline") ?? "").trim() || null,
    descripcionHome: String(formData.get("descripcion_home") ?? "").trim() || null,
    ubicacionDireccion: String(formData.get("ubicacion_direccion") ?? "").trim() || null,
    mapaQuery: String(formData.get("mapa_query") ?? "").trim() || null,
    whatsappE164: String(formData.get("whatsapp_e164") ?? "").replace(/\D/g, "") || null,
    emailContacto: String(formData.get("email_contacto") ?? "").trim() || null,
    facebookUrl: String(formData.get("facebook_url") ?? "").trim() || null,
    instagramUrl: String(formData.get("instagram_url") ?? "").trim() || null,
  };
}

/** Crea la fila si no existe; si no, actualiza la primera (tabla singleton). */
export async function guardarConfiguracion(formData: FormData): Promise<ActionResult> {
  const data = configuracionFromForm(formData);
  if (!String(formData.get("complejo_nombre") ?? "").trim()) {
    return { success: false, error: "El nombre del complejo es obligatorio." };
  }

  try {
    const existing = await prisma.configuracion.findFirst();
    if (!existing) {
      await prisma.configuracion.create({
        data: {
          id: randomUUID(),
          ...data,
        },
      });
    } else {
      await prisma.configuracion.update({
        where: { id: existing.id },
        data,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar.";
    return { success: false, error: msg };
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  return { success: true };
}
