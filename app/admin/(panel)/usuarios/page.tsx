import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UsuariosTable } from "@/components/admin/usuarios/UsuariosTable";
import { isEmpleado } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/admin/login");
  }
  const role = session.user.rol ?? "EMPLEADO";
  if (isEmpleado(role)) {
    redirect("/admin");
  }

  const rows = await prisma.usuario.findMany({
    orderBy: { creadoEn: "desc" },
  });

  const usuarios = rows.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    rol: u.rol,
    activo: u.activo,
    creadoEn: u.creadoEn.toISOString(),
  }));

  return (
    <UsuariosTable
      initialUsuarios={usuarios}
      currentUserId={session.user.id}
      currentUserRole={role}
    />
  );
}
