"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  crearCategoriaInventarioAccion,
  editarCategoriaInventarioAccion,
  eliminarCategoriaInventarioAccion,
} from "@/app/admin/(panel)/inventario/actions";
import { INVENTARIO_CATEGORIA_ICON_KEYS, type InventarioCategoriaIconKey } from "@/lib/inventario-categoria-icons";
import type { InventarioCategoriaConConteo } from "@/types";
import { useToast } from "@/hooks/useToast";
import { CategoriaInventarioIcon } from "./CategoriaInventarioIcon";

const ICON_LABELS: Record<InventarioCategoriaIconKey, string> = {
  Sofa: "Living / sala",
  Tv: "TV / entretenimiento",
  UtensilsCrossed: "Cocina",
  Bed: "Dormitorio",
  ShowerHead: "Baño",
  Sparkles: "Limpieza",
  Plug: "Electricidad",
  Umbrella: "Exterior",
  Package: "General",
};

export function CategoriasInventarioClient({ initialRows }: { initialRows: InventarioCategoriaConConteo[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventarioCategoriaConConteo | null>(null);
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState<string>("Package");
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventarioCategoriaConConteo | null>(null);

  function openCreate() {
    setEditing(null);
    setNombre("");
    setIcono("Package");
    setFormOpen(true);
  }

  function openEdit(row: InventarioCategoriaConConteo) {
    setEditing(row);
    setNombre(row.nombre);
    const keys = INVENTARIO_CATEGORIA_ICON_KEYS as readonly string[];
    setIcono(row.icono && keys.includes(row.icono) ? row.icono : "Package");
    setFormOpen(true);
  }

  async function onSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) {
      showToast("Completá el nombre.", "error");
      return;
    }
    setPending(true);
    try {
      if (editing) {
        const res = await editarCategoriaInventarioAccion(editing.id, {
          nombre: n,
          icono: icono || null,
        });
        if (res.ok) {
          showToast("Categoría actualizada.", "success");
          setFormOpen(false);
          router.refresh();
        } else showToast(res.error ?? "No se pudo guardar.", "error");
      } else {
        const res = await crearCategoriaInventarioAccion({ nombre: n, icono: icono || null });
        if (res.ok) {
          showToast("Categoría creada.", "success");
          setFormOpen(false);
          router.refresh();
        } else showToast(res.error ?? "No se pudo crear.", "error");
      }
    } finally {
      setPending(false);
    }
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    try {
      const res = await eliminarCategoriaInventarioAccion(deleteTarget.id);
      if (res.ok) {
        showToast("Categoría eliminada. Los artículos quedaron sin categoría.", "success");
        setDeleteTarget(null);
        router.refresh();
      } else showToast(res.error ?? "No se pudo eliminar.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/inventario"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-fm-muted hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inventario
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Categorías de inventario</h1>
          <p className="mt-1 text-sm text-fm-muted">
            Definí categorías para clasificar artículos (cocina, baño, etc.).
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="bg-fm-red text-white hover:bg-red-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-fm-border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-fm-border bg-gray-50 text-xs font-semibold uppercase text-fm-muted">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="hidden px-4 py-3 sm:table-cell">Icono</th>
              <th className="px-4 py-3">Artículos</th>
              <th className="w-32 px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-fm-muted">
                  No hay categorías. Creá la primera con &quot;Nueva categoría&quot;.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-fm-border last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.nombre}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="inline-flex items-center gap-2 text-fm-muted">
                      <CategoriaInventarioIcon icono={row.icono} className="h-5 w-5 text-gray-600" />
                      <span className="text-xs">
                        {row.icono && (INVENTARIO_CATEGORIA_ICON_KEYS as readonly string[]).includes(row.icono)
                          ? ICON_LABELS[row.icono as InventarioCategoriaIconKey]
                          : "General"}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.items_count}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${row.nombre}`}
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        aria-label={`Eliminar ${row.nombre}`}
                        onClick={() => setDeleteTarget(row)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmitForm} className="space-y-4">
            <div>
              <Label htmlFor="cat-nombre">Nombre</Label>
              <Input
                id="cat-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Cocina"
                className="mt-1.5"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="cat-icono">Icono en listados</Label>
              <select
                id="cat-icono"
                value={icono}
                onChange={(e) => setIcono(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {INVENTARIO_CATEGORIA_ICON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {ICON_LABELS[key]}
                  </option>
                ))}
              </select>
              <p className="mt-2 flex items-center gap-2 text-xs text-fm-muted">
                Vista previa: <CategoriaInventarioIcon icono={icono} className="h-5 w-5 text-gray-700" />
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} className="bg-fm-red text-white hover:bg-red-700">
                {pending ? "Guardando…" : editing ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Se eliminará <strong>{deleteTarget.nombre}</strong>. Los artículos que la usaban quedarán sin
                  categoría (no se borran).
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                void onConfirmDelete();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
