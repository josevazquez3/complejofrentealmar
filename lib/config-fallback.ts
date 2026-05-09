import type { Configuracion } from "@/types";

/** Valores por defecto si falla la lectura desde la BD o no hay fila. */
export const CONFIG_FALLBACK: Configuracion = {
  id: "00000000-0000-0000-0000-000000000000",
  complejo_nombre: "Complejo Frente al Mar",
  tagline: "Tu refugio en la Costa Atlántica Argentina",
  descripcion_home:
    "Descubrí la magia de la costa bonaerense en nuestro complejo de casas exclusivas. A metros del mar, rodeado de naturaleza y con todo el confort que necesitás para unas vacaciones inolvidables.",
  ubicacion_direccion: "Costa Atlántica Argentina",
  mapa_query: "-37.2636,-56.9789",
  whatsapp_mensaje: "",
  whatsapp_e164: "5492255000000",
  email_contacto: "info@complejofrentealmar.com.ar",
  facebook_url: "https://facebook.com",
  instagram_url: "https://instagram.com",
  youtube_video_id: null,
  logo_url: null,
  whatsapp_mensaje_publico: "Hola! Me comunico desde el sitio web. Quisiera hacer una consulta.",
  updated_at: new Date().toISOString(),
};

export function mergeConfigWithFallback(row: Configuracion | null): Configuracion {
  if (!row) return { ...CONFIG_FALLBACK };
  return {
    ...CONFIG_FALLBACK,
    ...row,
    complejo_nombre: row.complejo_nombre?.trim() || CONFIG_FALLBACK.complejo_nombre,
    tagline: row.tagline ?? CONFIG_FALLBACK.tagline,
    descripcion_home: row.descripcion_home ?? CONFIG_FALLBACK.descripcion_home,
    ubicacion_direccion: row.ubicacion_direccion ?? CONFIG_FALLBACK.ubicacion_direccion,
    mapa_query: row.mapa_query ?? CONFIG_FALLBACK.mapa_query,
    whatsapp_mensaje: row.whatsapp_mensaje ?? CONFIG_FALLBACK.whatsapp_mensaje,
    whatsapp_e164: row.whatsapp_e164 ?? CONFIG_FALLBACK.whatsapp_e164,
    email_contacto: row.email_contacto ?? CONFIG_FALLBACK.email_contacto,
    facebook_url: row.facebook_url ?? CONFIG_FALLBACK.facebook_url,
    instagram_url: row.instagram_url ?? CONFIG_FALLBACK.instagram_url,
    youtube_video_id: row.youtube_video_id ?? CONFIG_FALLBACK.youtube_video_id,
    logo_url: row.logo_url ?? CONFIG_FALLBACK.logo_url,
  };
}
