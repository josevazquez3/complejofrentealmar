"use client";

import { useEffect, useState } from "react";
import type { Rol } from "@prisma/client";
import { toast } from "sonner";
import { editarUsuario } from "@/app/admin/(panel)/usuarios/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROL_LABEL: Record<Rol, string> = {
  SUPER_ADMIN: "Super administrador",
  ADMIN: "Administrador",
  EMPLEADO: "Empleado",
};

function rolesSelectable(canSuper: boolean): Rol[] {
  if (canSuper) return ["SUPER_ADMIN", "ADMIN", "EMPLEADO"];
  return ["ADMIN", "EMPLEADO"];
}

export type UsuarioRow = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
};

export function EditarUsuarioModal({
  usuario,
  open,
  onOpenChange,
  actorIsSuperAdmin,
}: {
  usuario: UsuarioRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  actorIsSuperAdmin: boolean;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("EMPLEADO");
  const [activo, setActivo] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setEmail(usuario.email);
      setPassword("");
      setRol(usuario.rol);
      setActivo(usuario.activo);
    }
  }, [usuario]);

  const opciones = rolesSelectable(actorIsSuperAdmin);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario) return;
    if (!nombre.trim() || !email.trim()) {
      toast.error("Nombre y email son obligatorios.");
      return;
    }
    setBusy(true);
    const res = await editarUsuario(usuario.id, {
      nombre: nombre.trim(),
      email: email.trim(),
      rol,
      activo,
      password: password.trim() || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success("Usuario actualizado");
    onOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="eu-nombre">Nombre</Label>
            <Input
              id="eu-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="rounded-xl border-nautico-900/15"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eu-email">Email</Label>
            <Input
              id="eu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border-nautico-900/15"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eu-pass">Nueva contraseña (opcional)</Label>
            <Input
              id="eu-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              placeholder="Dejar vacío para no cambiar"
              autoComplete="new-password"
              className="rounded-xl border-nautico-900/15"
            />
          </div>
          <div className="grid gap-2">
            <Label>Rol</Label>
            <Select value={rol} onValueChange={(v) => setRol((v as Rol) ?? "EMPLEADO")}>
              <SelectTrigger className="w-full rounded-xl border-nautico-900/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opciones.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROL_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="eu-activo"
              checked={activo}
              onCheckedChange={(v) => setActivo(v === true)}
            />
            <Label htmlFor="eu-activo" className="cursor-pointer font-normal">
              Usuario activo
            </Label>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="bg-nautico-800 text-blanco hover:bg-arena-600">
              {busy ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
