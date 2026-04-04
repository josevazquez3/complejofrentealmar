import type { Rol } from "@prisma/client";

export type RolLiteral = "SUPER_ADMIN" | "ADMIN" | "EMPLEADO";

export function isEmpleado(role: string | undefined | null): boolean {
  return role === "EMPLEADO";
}

export function canAccessUsuariosModule(role: string | undefined | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canDeleteUsuario(role: string | undefined | null): boolean {
  return role === "SUPER_ADMIN";
}

/** Solo SUPER_ADMIN puede asignar el rol SUPER_ADMIN al crear/editar. */
export function canAssignSuperAdmin(actorRole: string | undefined | null): boolean {
  return actorRole === "SUPER_ADMIN";
}

export function assertAssignableRol(actorRole: string, targetRol: Rol): void {
  if (targetRol === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN") {
    throw new Error("Solo un SUPER_ADMIN puede asignar el rol SUPER_ADMIN.");
  }
}
