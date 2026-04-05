"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  createUnidad,
  deleteImage,
  deleteUnidad,
  toggleUnidad,
  updateUnidad,
  uploadImage,
} from "@/app/actions/configuracion";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import type { Unidad } from "@/types/configuracion";
import { cn } from "@/lib/utils";

function snippet(text: string, max = 100) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function pathForStorageDelete(url: string): string | null {
  const u = url.trim();
  if (!u || !u.startsWith("http")) return null;
  return u.split("?")[0] ?? u;
}

export function UnidadesEditor({ initial }: { initial: Unidad[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Unidad[]>(() =>
    [...initial].sort((a, b) => a.orden - b.orden || a.created_at.localeCompare(b.created_at))
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unidad | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [precio, setPrecio] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setRows(
      [...initial].sort((a, b) => a.orden - b.orden || a.created_at.localeCompare(b.created_at))
    );
  }, [initial]);

  function openCreate() {
    setEditing(null);
    setTitulo("");
    setDescripcion("");
    setFotos([]);
    setPrecio("");
    setPendingFile(null);
    setOpen(true);
  }

  function openEdit(u: Unidad) {
    setEditing(u);
    setTitulo(u.titulo);
    setDescripcion(u.descripcion);
    setFotos([...(u.fotos ?? [])]);
    setPrecio(u.precio?.trim() ?? "");
    setPendingFile(null);
    setOpen(true);
  }

  const addPendingUpload = () => {
    if (!pendingFile) return;
    const run = async () => {
      setBusy("upload");
      try {
        const fd = new FormData();
        fd.append("file", pendingFile);
        fd.append("folder", "unidades");
        const { url } = await uploadImage(fd);
        setFotos((f) => {
          const next = [...f, url];
          if (next.length > 8) {
            toast.message("Muchas fotos; en la web conviene priorizar las mejores.");
          }
          return next;
        });
        setPendingFile(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al subir");
      } finally {
        setBusy(null);
      }
    };
    void run();
  };

  const removeFotoAt = async (i: number) => {
    const url = fotos[i];
    const path = pathForStorageDelete(url);
    setBusy(`rf-${i}`);
    try {
      if (path) await deleteImage(path);
      setFotos((f) => f.filter((_, j) => j !== i));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar");
    } finally {
      setBusy(null);
    }
  };

  const onSaveModal = async () => {
    if (!titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }
    setBusy("saveModal");
    try {
      if (editing) {
        await updateUnidad(editing.id, {
          titulo: titulo.trim(),
          descripcion,
          precio: precio.trim() || null,
          fotos,
        });
        toast.success("Unidad actualizada.");
      } else {
        await createUnidad({
          titulo: titulo.trim(),
          descripcion,
          precio: precio.trim() || null,
          fotos,
        });
        toast.success("Unidad creada.");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(null);
    }
  };

  const onToggle = (u: Unidad) => {
    const next = !u.habilitada;
    const msg = next ? "¿Habilitar esta unidad en el sitio público?" : "¿Deshabilitar esta unidad?";
    if (!window.confirm(msg)) return;
    setBusy(`tg-${u.id}`);
    void (async () => {
      try {
        await toggleUnidad(u.id, next);
        toast.success(next ? "Habilitada." : "Deshabilitada.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      } finally {
        setBusy(null);
      }
    })();
  };

  const onDelete = (u: Unidad) => {
    if (!window.confirm(`¿Eliminar definitivamente “${u.titulo}”?`)) return;
    setBusy(`dl-${u.id}`);
    void (async () => {
      try {
        await deleteUnidad(u.id);
        toast.success("Unidad eliminada.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      } finally {
        setBusy(null);
      }
    })();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          className="bg-nautico-900 text-white hover:bg-nautico-800"
          onClick={openCreate}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar unidad
        </Button>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {rows.map((u) => (
          <li
            key={u.id}
            className="rounded-xl border border-nautico-900/10 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-nautico-900">{u.titulo}</h3>
              <Badge
                className={cn(
                  u.habilitada ? "bg-green-600 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-400"
                )}
              >
                {u.habilitada ? "Habilitada" : "Deshabilitada"}
              </Badge>
            </div>
            <div className="mt-2 flex gap-1 overflow-x-auto py-1">
              {(u.fotos ?? []).slice(0, 4).map((src, i) => (
                <div key={i} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-nautico-900/10">
                  <Image src={src} alt="" fill className="object-cover" sizes="56px" unoptimized />
                </div>
              ))}
              {(!u.fotos || u.fotos.length === 0) && (
                <span className="text-xs text-nautico-500">Sin fotos</span>
              )}
            </div>
            <p className="mt-2 text-sm text-nautico-700">{snippet(u.descripcion)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => openEdit(u)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy !== null}
                onClick={() => onToggle(u)}
              >
                {busy === `tg-${u.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {u.habilitada ? "Deshabilitar" : "Habilitar"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={busy !== null}
                onClick={() => onDelete(u)}
              >
                {busy === `dl-${u.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {rows.length === 0 ? (
        <p className="text-sm text-nautico-600">No hay unidades de marketing. Agregá la primera.</p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar unidad" : "Nueva unidad"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="u-titulo">Título</Label>
              <Input
                id="u-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="u-desc">Descripción</Label>
              <Textarea
                id="u-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="mt-1 min-h-[140px] resize-y"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Fotos</Label>
                {fotos.length > 8 ? (
                  <span className="text-xs text-amber-700">Muchas fotos ({fotos.length}); considerá reducir.</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {fotos.map((src, i) => (
                  <div key={`${src}-${i}`} className="relative h-20 w-20 overflow-hidden rounded-md border">
                    <Image src={src} alt="" fill className="object-cover" sizes="80px" unoptimized />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute right-0 top-0 h-7 w-7"
                      disabled={busy !== null}
                      onClick={() => void removeFotoAt(i)}
                    >
                      {busy === `rf-${i}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="cursor-pointer text-sm">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busy !== null}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) setPendingFile(f);
                    }}
                  />
                  <span className="inline-flex items-center gap-1 rounded-md border border-nautico-900/20 px-3 py-2 hover:bg-nautico-900/5">
                    <ImagePlus className="h-4 w-4" />
                    Agregar foto
                  </span>
                </label>
                {pendingFile ? (
                  <>
                    <span className="max-w-[min(200px,40vw)] truncate text-xs text-nautico-600">{pendingFile.name}</span>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-nautico-900 text-white"
                      disabled={busy !== null}
                      onClick={addPendingUpload}
                    >
                      {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Subir
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() => setPendingFile(null)}
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Otra foto
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Label htmlFor="u-precio">Precio / Tarifa</Label>
                <Badge variant="secondary" className="font-normal text-nautico-700">
                  (opcional)
                </Badge>
              </div>
              <Input
                id="u-precio"
                type="text"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: $50.000 por noche"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-nautico-900 text-white hover:bg-nautico-800"
              disabled={busy !== null}
              onClick={() => void onSaveModal()}
            >
              {busy === "saveModal" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
