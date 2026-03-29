"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

export async function guardarConfiguracion(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { success: false, error: "Falta el identificador de configuración." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion")
    .update({
      complejo_nombre: String(formData.get("complejo_nombre") ?? "").trim(),
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      descripcion_home: String(formData.get("descripcion_home") ?? "").trim() || null,
      ubicacion_direccion: String(formData.get("ubicacion_direccion") ?? "").trim() || null,
      mapa_query: String(formData.get("mapa_query") ?? "").trim() || null,
      whatsapp_e164: String(formData.get("whatsapp_e164") ?? "").replace(/\D/g, "") || null,
      email_contacto: String(formData.get("email_contacto") ?? "").trim() || null,
      facebook_url: String(formData.get("facebook_url") ?? "").trim() || null,
      instagram_url: String(formData.get("instagram_url") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  return { success: true };
}
