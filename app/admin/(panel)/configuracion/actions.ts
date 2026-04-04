"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";

export async function guardarConfiguracion(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { success: false, error: "Falta el identificador de configuración." };
  }

  try {
    await prisma.configuracion.update({
      where: { id },
      data: {
        complejoNombre: String(formData.get("complejo_nombre") ?? "").trim(),
        tagline: String(formData.get("tagline") ?? "").trim() || null,
        descripcionHome: String(formData.get("descripcion_home") ?? "").trim() || null,
        ubicacionDireccion: String(formData.get("ubicacion_direccion") ?? "").trim() || null,
        mapaQuery: String(formData.get("mapa_query") ?? "").trim() || null,
        whatsappE164: String(formData.get("whatsapp_e164") ?? "").replace(/\D/g, "") || null,
        emailContacto: String(formData.get("email_contacto") ?? "").trim() || null,
        facebookUrl: String(formData.get("facebook_url") ?? "").trim() || null,
        instagramUrl: String(formData.get("instagram_url") ?? "").trim() || null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar.";
    return { success: false, error: msg };
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  return { success: true };
}
