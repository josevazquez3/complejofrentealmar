"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import type { Rol } from "@prisma/client";
import { getServerUser } from "@/lib/auth";
import { assertAssignableRol, canDeleteUsuario } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export type UsuarioActionState = { ok: true } | { ok: false; message: string };

async function requireGestorUsuarios() {
  const u = await getServerUser();
  if (!u) throw new Error("No autorizado");
  if (u.rol === "EMPLEADO") throw new Error("Sin permiso para gestionar usuarios.");
  return u;
}

export async function crearUsuario(data: {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
}): Promise<UsuarioActionState> {
  try {
    const actor = await requireGestorUsuarios();
    assertAssignableRol(actor.rol, data.rol);

    const nombre = data.nombre.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;
    if (!nombre || !email || !password) {
      return { ok: false, message: "Completá nombre, email y contraseña." };
    }
    if (password.length < 6) {
      return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };
    }

    const hashed = await hash(password, 10);
    await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashed,
        rol: data.rol,
        activo: true,
      },
    });
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al crear usuario.";
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      return { ok: false, message: "Ya existe un usuario con ese email." };
    }
    return { ok: false, message: msg };
  }
}

export async function editarUsuario(
  id: string,
  data: {
    nombre: string;
    email: string;
    rol: Rol;
    activo: boolean;
    password?: string;
  }
): Promise<UsuarioActionState> {
  try {
    const actor = await requireGestorUsuarios();
    assertAssignableRol(actor.rol, data.rol);

    const nombre = data.nombre.trim();
    const email = data.email.trim().toLowerCase();
    if (!nombre || !email) {
      return { ok: false, message: "Nombre y email son obligatorios." };
    }

    const pwd = data.password?.trim();
    if (pwd && pwd.length < 6) {
      return { ok: false, message: "La contraseña debe tener al menos 6 caracteres." };
    }

    const update: {
      nombre: string;
      email: string;
      rol: Rol;
      activo: boolean;
      password?: string;
    } = {
      nombre,
      email,
      rol: data.rol,
      activo: data.activo,
    };
    if (pwd) {
      update.password = await hash(pwd, 10);
    }

    await prisma.usuario.update({
      where: { id },
      data: update,
    });
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al actualizar usuario.";
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      return { ok: false, message: "Ya existe un usuario con ese email." };
    }
    return { ok: false, message: msg };
  }
}

export async function borrarUsuario(id: string): Promise<UsuarioActionState> {
  try {
    const actor = await getServerUser();
    if (!actor || !canDeleteUsuario(actor.rol)) {
      return { ok: false, message: "Solo SUPER_ADMIN puede eliminar usuarios." };
    }
    if (actor.id === id) {
      return { ok: false, message: "No podés eliminar tu propia cuenta." };
    }

    await prisma.usuario.delete({ where: { id } });
    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al eliminar usuario.";
    return { ok: false, message: msg };
  }
}
