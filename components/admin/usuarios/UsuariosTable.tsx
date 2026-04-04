"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { borrarUsuario } from "@/app/admin/(panel)/usuarios/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateAR } from "@/lib/format";
import { CrearUsuarioModal } from "./CrearUsuarioModal";
import { EditarUsuarioModal, type UsuarioRow } from "./EditarUsuarioModal";

const ROL_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  EMPLEADO: "Empleado",
};

export function UsuariosTable({
  initialUsuarios,
  currentUserId,
  currentUserRole,
}: {
  initialUsuarios: UsuarioRow[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<UsuarioRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isSuper = currentUserRole === "SUPER_ADMIN";
  const actorIsSuperAdmin = isSuper;

  function openEdit(u: UsuarioRow) {
    setEditRow(u);
    setEditOpen(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await borrarUsuario(deleteId);
    if (!res.ok) {
      toast.error(res.message);
      setDeleteId(null);
      return;
    }
    toast.success("Usuario eliminado");
    setDeleteId(null);
    window.location.reload();
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-nautico-900">Usuarios</h1>
          <p className="text-sm text-nautico-700/80">Gestión de cuentas del panel</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-nautico-800 text-blanco hover:bg-arena-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-nautico-900/10">
        <Table>
          <TableHeader>
            <TableRow className="bg-nautico-900/5">
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No hay usuarios
                </TableCell>
              </TableRow>
            ) : (
              initialUsuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{ROL_LABEL[u.rol] ?? u.rol}</TableCell>
                  <TableCell>
                    <span
                      className={
                        u.activo
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                          : "rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700"
                      }
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateAR(u.creadoEn.slice(0, 10))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(u)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {isSuper && u.id !== currentUserId ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => setDeleteId(u.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CrearUsuarioModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        actorIsSuperAdmin={actorIsSuperAdmin}
      />
      <EditarUsuarioModal
        usuario={editRow}
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditRow(null);
        }}
        actorIsSuperAdmin={actorIsSuperAdmin}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se borrará el registro de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
