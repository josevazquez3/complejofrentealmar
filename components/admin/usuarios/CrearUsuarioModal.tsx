"use client";

import { useState } from "react";
import type { Rol } from "@prisma/client";
import { toast } from "sonner";
import { crearUsuario } from "@/app/admin/(panel)/usuarios/actions";
import { Button } from "@/components/ui/button";
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

export function CrearUsuarioModal({
  open,
  onOpenChange,
  actorIsSuperAdmin,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  actorIsSuperAdmin: boolean;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("EMPLEADO");
  const [busy, setBusy] = useState(false);

  const opciones = rolesSelectable(actorIsSuperAdmin);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !password) {
      toast.error("Completá todos los campos.");
      return;
    }
    setBusy(true);
    const res = await crearUsuario({
      nombre: nombre.trim(),
      email: email.trim(),
      password,
      rol,
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success("Usuario creado");
    setNombre("");
    setEmail("");
    setPassword("");
    setRol("EMPLEADO");
    onOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cu-nombre">Nombre</Label>
            <Input
              id="cu-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="rounded-xl border-nautico-900/15"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cu-email">Email</Label>
            <Input
              id="cu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              className="rounded-xl border-nautico-900/15"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cu-pass">Contraseña</Label>
            <Input
              id="cu-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="bg-nautico-800 text-blanco hover:bg-arena-600">
              {busy ? "Guardando…" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
