import type { Configuracion } from "@/types";

/** Arma el `FormData` que espera `guardarConfiguracion`, con mensaje WhatsApp sustituido. */
export function configuracionToGuardarFormData(cfg: Configuracion, whatsappMensaje: string): FormData {
  const fd = new FormData();
  fd.set("complejo_nombre", cfg.complejo_nombre);
  fd.set("tagline", cfg.tagline ?? "");
  fd.set("descripcion_home", cfg.descripcion_home ?? "");
  fd.set("ubicacion_direccion", cfg.ubicacion_direccion ?? "");
  fd.set("mapa_query", cfg.mapa_query ?? "");
  fd.set("whatsapp_mensaje", whatsappMensaje);
  fd.set("whatsapp_e164", cfg.whatsapp_e164 ?? "");
  fd.set("email_contacto", cfg.email_contacto ?? "");
  fd.set("facebook_url", cfg.facebook_url ?? "");
  fd.set("instagram_url", cfg.instagram_url ?? "");
  return fd;
}
