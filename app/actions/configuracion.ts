"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { getServerUser } from "@/lib/auth";
import { deleteFromBlob, uploadToBlob } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
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

async function requireUser() {
  const user = await getServerUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

function revalidateComplejo() {
  revalidatePath("/admin/configuracion/editar");
  revalidatePath("/");
}

function mapCarousel(row: {
  id: string;
  url: string;
  storagePath: string;
  orden: number;
  createdAt: Date;
}): CarouselImage {
  return {
    id: row.id,
    url: row.url,
    storage_path: row.storagePath,
    orden: row.orden,
    created_at: row.createdAt.toISOString(),
  };
}

/**
 * Subida vía FormData: Next.js no permite pasar `File` como argumento directo a Server Actions.
 */
export async function uploadImage(formData: FormData): Promise<{ url: string; path: string }> {
  await requireUser();
  const raw = formData.get("file");
  const folder = String(formData.get("folder") ?? "").trim();
  if (!(raw instanceof File)) throw new Error("Archivo inválido");
  const file = raw;
  if (!file.size) throw new Error("Archivo vacío");
  if (!file.type.startsWith("image/")) throw new Error("Solo se permiten imágenes");
  const isGif = file.type === "image/gif";
  const maxSize = isGif ? 50 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxSize) throw new Error(isGif ? "Máximo 50 MB por GIF" : "Máximo 8 MB por imagen");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").slice(0, 40) || "misc";
  const pathname = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { url: publicUrl } = await uploadToBlob(pathname, buf, file.type || "image/jpeg");
  // `path` se usa como storagePath en carrusel; debe ser la misma URL absoluta que `url` (Blob: https://…).
  return { url: publicUrl, path: publicUrl };
}

export async function deleteImage(storagePathOrUrl: string): Promise<void> {
  await requireUser();
  if (!storagePathOrUrl?.trim()) return;
  await deleteFromBlob(storagePathOrUrl);
}

export async function getCarouselImages(): Promise<CarouselImage[]> {
  try {
    const rows = await prisma.carouselImage.findMany({ orderBy: { orden: "asc" } });
    return rows.map(mapCarousel);
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

  const existing = await prisma.carouselImage.findMany({
    select: { id: true, storagePath: true },
  });

  const newPaths = new Set(images.map((i) => i.path));
  for (const row of existing) {
    if (!newPaths.has(row.storagePath)) {
      try {
        await deleteFromBlob(row.storagePath);
      } catch {
        /* ya borrado o URL legacy */
      }
      await prisma.carouselImage.delete({ where: { id: row.id } });
    }
  }

  for (const img of images) {
    const found = await prisma.carouselImage.findFirst({
      where: { storagePath: img.path },
      select: { id: true },
    });
    if (found) {
      await prisma.carouselImage.update({
        where: { id: found.id },
        data: { url: img.url, orden: img.orden },
      });
    } else {
      await prisma.carouselImage.create({
        data: { url: img.url, storagePath: img.path, orden: img.orden },
      });
    }
  }

  revalidateComplejo();
}

export async function getInicioConfig(): Promise<InicioConfig | null> {
  try {
    const row = await prisma.inicioConfig.findFirst();
    if (!row) return null;
    return {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      fotos: row.fotos ?? [],
      updated_at: row.updatedAt.toISOString(),
    };
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

  const first = await prisma.inicioConfig.findFirst({ select: { id: true } });

  if (!first) {
    await prisma.inicioConfig.create({
      data: {
        titulo,
        descripcion: data.descripcion,
        fotos: fotosLimpias,
      },
    });
  } else {
    await prisma.inicioConfig.update({
      where: { id: first.id },
      data: {
        titulo,
        descripcion: data.descripcion,
        fotos: fotosLimpias,
      },
    });
  }

  revalidateComplejo();
}

export async function getUnidades(): Promise<Unidad[]> {
  try {
    const rows = await prisma.unidad.findMany({
      orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    });
    return rows.map((u) => ({
      id: u.id,
      titulo: u.titulo,
      descripcion: u.descripcion,
      precio: u.precio ?? null,
      fotos: u.fotos ?? [],
      habilitada: u.habilitada,
      orden: u.orden,
      created_at: u.createdAt.toISOString(),
      updated_at: u.updatedAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createUnidad(data: {
  titulo: string;
  descripcion: string;
  precio?: string | null;
  fotos: string[];
}): Promise<Unidad> {
  await requireUser();
  const titulo = data.titulo.trim();
  if (!titulo) throw new Error("El título es obligatorio");

  const precioLimpio =
    data.precio === undefined || data.precio === null
      ? null
      : String(data.precio).trim() || null;

  const agg = await prisma.unidad.aggregate({ _max: { orden: true } });
  const orden = (agg._max.orden ?? -1) + 1;

  const row = await prisma.unidad.create({
    data: {
      titulo,
      descripcion: data.descripcion.trim(),
      precio: precioLimpio,
      fotos: data.fotos.filter(Boolean),
      habilitada: true,
      orden,
    },
  });

  revalidateComplejo();
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    precio: row.precio ?? null,
    fotos: row.fotos ?? [],
    habilitada: row.habilitada,
    orden: row.orden,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function updateUnidad(id: string, data: Partial<Unidad>): Promise<void> {
  await requireUser();
  const patch: Prisma.UnidadUpdateInput = {};
  if (data.titulo !== undefined) patch.titulo = data.titulo.trim();
  if (data.descripcion !== undefined) patch.descripcion = data.descripcion;
  if (data.fotos !== undefined) patch.fotos = data.fotos;
  if (data.precio !== undefined) {
    patch.precio = data.precio === null ? null : String(data.precio).trim() || null;
  }
  if (data.orden !== undefined) patch.orden = data.orden;
  if (data.habilitada !== undefined) patch.habilitada = data.habilitada;

  await prisma.unidad.update({ where: { id }, data: patch });
  revalidateComplejo();
}

export async function toggleUnidad(id: string, habilitada: boolean): Promise<void> {
  await requireUser();
  await prisma.unidad.update({ where: { id }, data: { habilitada } });
  revalidateComplejo();
}

export async function deleteUnidad(id: string): Promise<void> {
  await requireUser();
  await prisma.unidad.delete({ where: { id } });
  revalidateComplejo();
}

export async function getSeccionTexto(id: SeccionTextoId): Promise<SeccionTexto> {
  try {
    const row = await prisma.seccionTexto.findUnique({ where: { id } });
    if (!row) return SECCION_DEFAULTS[id];
    return {
      id: row.id as SeccionTextoId,
      titulo: row.titulo,
      descripcion: row.descripcion,
      updated_at: row.updatedAt.toISOString(),
    };
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

  await prisma.seccionTexto.upsert({
    where: { id: tid },
    create: {
      id: tid,
      titulo: data.titulo.trim(),
      descripcion: data.descripcion.trim(),
    },
    update: {
      titulo: data.titulo.trim(),
      descripcion: data.descripcion.trim(),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/configuracion/editar");
}
