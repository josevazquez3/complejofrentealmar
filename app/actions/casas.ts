"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getServerUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Mensaje claro si Prisma/Postgres rechaza el delete por FK (p. ej. BD sin migraciones al día). */
function mensajeErrorFkEliminarCasa(e: unknown): string | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2003" || e.code === "P2014") {
      return "No se puede eliminar esta casa: hay registros enlazados que la base de datos no puede borrar en cascada. Suele pasar si PostgreSQL no tiene las mismas reglas que el schema actual (onDelete Cascade / SetNull). Ejecutá las migraciones de Prisma (`npx prisma migrate deploy`) o quitá manualmente filas que referencien esta casa (inventario, tesorería, reservas).";
    }
    if (e.code === "P2025") {
      return "Esta casa ya no existe o fue eliminada.";
    }
  }
  if (e instanceof Error) {
    const m = e.message.toLowerCase();
    if (m.includes("foreign key") || m.includes("violates foreign key constraint")) {
      return "No se puede eliminar: violación de clave foránea. Revisá inventario, tesorería y reservas vinculadas a esta casa, o alineá la BD con `prisma migrate deploy`.";
    }
  }
  return null;
}

async function requireEditor() {
  const u = await getServerUser();
  if (!u) return { ok: false as const, error: "No autorizado." };
  if (u.rol === "EMPLEADO") return { ok: false as const, error: "Sin permiso." };
  return { ok: true as const, user: u };
}

function revalidateCasaPaths(id?: string) {
  revalidatePath("/admin/casas");
  revalidatePath("/");
  revalidatePath("/reservas");
  revalidatePath("/admin/reservas");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/tesoreria");
  if (id) revalidatePath(`/casas/${id}`);
}

export async function setCasaActiva(
  id: string,
  activa: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditor();
  if (!auth.ok) return auth;
  try {
    await prisma.casa.update({ where: { id }, data: { activa } });
    revalidateCasaPaths(id);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo actualizar." };
  }
}

export async function crearCasa(data: {
  nombre: string;
  descripcion: string;
  capacidad: number;
  activa: boolean;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireEditor();
  if (!auth.ok) return auth;
  const nombre = data.nombre.trim();
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };
  const cap = Math.floor(Number(data.capacidad));
  if (!Number.isFinite(cap) || cap < 1) return { ok: false, error: "La capacidad debe ser al menos 1." };
  try {
    const row = await prisma.casa.create({
      data: {
        nombre,
        descripcion: data.descripcion.trim() || null,
        capacidadPersonas: cap,
        activa: Boolean(data.activa),
        fotos: [],
      },
    });
    revalidateCasaPaths(row.id);
    return { ok: true, id: row.id };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo crear la casa." };
  }
}

export async function editarCasa(data: {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  activa: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditor();
  if (!auth.ok) return auth;
  const nombre = data.nombre.trim();
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };
  const cap = Math.floor(Number(data.capacidad));
  if (!Number.isFinite(cap) || cap < 1) return { ok: false, error: "La capacidad debe ser al menos 1." };
  try {
    await prisma.casa.update({
      where: { id: data.id },
      data: {
        nombre,
        descripcion: data.descripcion.trim() || null,
        capacidadPersonas: cap,
        activa: Boolean(data.activa),
      },
    });
    revalidateCasaPaths(data.id);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
}

export async function eliminarCasa(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireEditor();
  if (!auth.ok) return auth;
  try {
    const bloqueadas = await prisma.reserva.count({
      where: {
        casaId: id,
        estado: { in: ["pendiente", "confirmada"] },
      },
    });
    if (bloqueadas > 0) {
      return {
        ok: false,
        error: `No se puede eliminar: hay ${bloqueadas} reserva(s) pendiente(s) o confirmada(s). Cancelá o eliminá esas reservas primero.`,
      };
    }
    await prisma.casa.delete({ where: { id } });
    revalidateCasaPaths();
    revalidatePath(`/casas/${id}`);
    return { ok: true };
  } catch (e: unknown) {
    const fk = mensajeErrorFkEliminarCasa(e);
    if (fk) return { ok: false, error: fk };
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo eliminar." };
  }
}
