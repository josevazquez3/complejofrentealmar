"use server";

import { revalidatePath } from "next/cache";
import { getServerUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  CarouselImage,
  InicioConfig,
  SeccionTexto,
  SeccionTextoId,
  Unidad,
} from "@/types/configuracion";

const SECCION_DEFAULTS: Record<SeccionTextoId, SeccionTexto> = {
  equipamiento: {
    id: "equipamiento",
    titulo: "EQUIPAMIENTO",
    descripcion:
      "Nuestras unidades cuentan con decoración cuidada, cocina equipada, climatización en dormitorios principales, TV, ropa de cama, parrilla individual en terrazas o balcones y espacios pensados para el descanso frente al mar.",
    updated_at: new Date(0).toISOString(),
  },
  servicios: {
    id: "servicios",
    titulo: "SERVICIOS",
    descripcion:
      "Servicios de mucama, desayuno en temporada alta, seguridad nocturna, reposeras y atención personalizada para que su estadía sea tranquila durante las cuatro estaciones. Consulte disponibilidad y condiciones según época del año.",
    updated_at: new Date(0).toISOString(),
  },
};

const BUCKET = "complejo-media";

async function requireUser() {
  const user = await getServerUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

function revalidateComplejo() {
  revalidatePath("/admin/configuracion/editar");
  revalidatePath("/");
}

export async function uploadImage(
  file: File,
  folder: string
): Promise<{ url: string; path: string }> {
  await requireUser();
  if (!file || !file.size) throw new Error("Archivo vacío");
  if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes");
  if (file.size > 8 * 1024 * 1024) throw new Error("Máximo 8 MB por imagen");

  const supabase = await createClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").slice(0, 40) || "misc";
  const path = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: publicUrl, path };
}

export async function deleteImage(storagePath: string): Promise<void> {
  await requireUser();
  if (!storagePath?.trim()) return;
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

export async function getCarouselImages(): Promise<CarouselImage[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("carousel_images")
      .select("*")
      .order("orden", { ascending: true });
    if (error) return [];
    return (data ?? []) as CarouselImage[];
  } catch {
    return [];
  }
}

export async function saveCarouselImages(
  images: { url: string; path: string; orden: number }[]
): Promise<void> {
  await requireUser();
  if (images.length === 0) throw new Error("Agregá al menos una imagen al carrusel");
  if (images.length > 10) throw new Error("Máximo 10 imágenes");

  const supabase = await createClient();
  const { data: existing, error: selErr } = await supabase
    .from("carousel_images")
    .select("id, storage_path");
  if (selErr) throw new Error(selErr.message);

  const newPaths = new Set(images.map((i) => i.path));
  for (const row of existing ?? []) {
    if (!newPaths.has(row.storage_path)) {
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
      await supabase.from("carousel_images").delete().eq("id", row.id);
    }
  }

  for (const img of images) {
    const { data: row } = await supabase
      .from("carousel_images")
      .select("id")
      .eq("storage_path", img.path)
      .maybeSingle();
    if (row?.id) {
      const { error } = await supabase
        .from("carousel_images")
        .update({ url: img.url, orden: img.orden })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("carousel_images").insert({
        url: img.url,
        storage_path: img.path,
        orden: img.orden,
      });
      if (error) throw new Error(error.message);
    }
  }

  revalidateComplejo();
}

export async function getInicioConfig(): Promise<InicioConfig | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("inicio_config").select("*").limit(1).maybeSingle();
    if (error || !data) return null;
    return data as InicioConfig;
  } catch {
    return null;
  }
}

export async function saveInicioConfig(data: {
  titulo: string;
  descripcion: string;
  fotos: string[];
}): Promise<void> {
  await requireUser();
  const titulo = data.titulo.trim();
  if (!titulo) throw new Error("El título es obligatorio");
  const fotosLimpias = data.fotos.slice(0, 4).map((f) => String(f).trim()).filter(Boolean);

  const supabase = await createClient();
  const { data: existing, error: selErr } = await supabase
    .from("inicio_config")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);

  if (!existing?.id) {
    const { error } = await supabase.from("inicio_config").insert({
      titulo,
      descripcion: data.descripcion,
      fotos: fotosLimpias,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("inicio_config")
      .update({
        titulo,
        descripcion: data.descripcion,
        fotos: fotosLimpias,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  }

  revalidateComplejo();
}

export async function getUnidades(): Promise<Unidad[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("unidades")
      .select("*")
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true }); // desempate
    if (error) return [];
    return (data ?? []) as Unidad[];
  } catch {
    return [];
  }
}

export async function createUnidad(data: {
  titulo: string;
  descripcion: string;
  fotos: string[];
}): Promise<Unidad> {
  await requireUser();
  const titulo = data.titulo.trim();
  if (!titulo) throw new Error("El título es obligatorio");

  const supabase = await createClient();
  const { data: maxRow } = await supabase
    .from("unidades")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();
  const orden = (maxRow?.orden ?? -1) + 1;

  const { data: row, error } = await supabase
    .from("unidades")
    .insert({
      titulo,
      descripcion: data.descripcion.trim(),
      fotos: data.fotos.filter(Boolean),
      habilitada: true,
      orden,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidateComplejo();
  return row as Unidad;
}

export async function updateUnidad(id: string, data: Partial<Unidad>): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.titulo !== undefined) patch.titulo = data.titulo.trim();
  if (data.descripcion !== undefined) patch.descripcion = data.descripcion;
  if (data.fotos !== undefined) patch.fotos = data.fotos;
  if (data.orden !== undefined) patch.orden = data.orden;
  if (data.habilitada !== undefined) patch.habilitada = data.habilitada;

  const { error } = await supabase.from("unidades").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateComplejo();
}

export async function toggleUnidad(id: string, habilitada: boolean): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("unidades")
    .update({ habilitada, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateComplejo();
}

export async function deleteUnidad(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("unidades").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateComplejo();
}

export async function getSeccionTexto(id: SeccionTextoId): Promise<SeccionTexto> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("secciones_texto").select("*").eq("id", id).maybeSingle();
    if (error || !data) return SECCION_DEFAULTS[id];
    return data as SeccionTexto;
  } catch {
    return SECCION_DEFAULTS[id];
  }
}

export async function saveSeccionTexto(
  id: string,
  data: { titulo: string; descripcion: string }
): Promise<void> {
  await requireUser();
  const tid = id === "servicios" ? "servicios" : "equipamiento";
  const supabase = await createClient();
  const { error } = await supabase.from("secciones_texto").upsert(
    {
      id: tid,
      titulo: data.titulo.trim(),
      descripcion: data.descripcion.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/configuracion/editar");
}
