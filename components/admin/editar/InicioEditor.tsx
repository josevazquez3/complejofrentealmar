"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { deleteImage, saveInicioConfig, uploadImage } from "@/app/actions/configuracion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InicioConfig } from "@/types/configuracion";

function pathFromComplejoMediaUrl(url: string): string | null {
  const idx = url.indexOf("/complejo-media/");
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + "/complejo-media/".length).split("?")[0] ?? "");
}

function padFour(fotos: string[] | null | undefined): string[] {
  const a = [...(fotos ?? [])].slice(0, 4);
  while (a.length < 4) a.push("");
  return a;
}

export function InicioEditor({ initial }: { initial: InicioConfig | null }) {
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [fotos, setFotos] = useState<string[]>(() => padFour(initial?.fotos));
  const [slotFile, setSlotFile] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setTitulo(initial?.titulo ?? "");
    setDescripcion(initial?.descripcion ?? "");
    setFotos(padFour(initial?.fotos));
  }, [initial]);

  const occupied = fotos.filter(Boolean).length;

  const pickForSlot = (slot: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) {
      setSlotFile(slot);
      setFile(f);
    }
  };

  const uploadToSlot = async () => {
    if (slotFile === null || !file) return;
    setBusy(`up-${slotFile}`);
    try {
      const { url } = await uploadImage(file, "inicio");
      setFotos((prev) => {
        const next = [...prev];
        next[slotFile] = url;
        return padFour(next);
      });
      setFile(null);
      setSlotFile(null);
      toast.success("Foto subida.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setBusy(null);
    }
  };

  const clearSlot = async (slot: number) => {
    const url = fotos[slot];
    if (!url) return;
    const path = pathFromComplejoMediaUrl(url);
    setBusy(`cl-${slot}`);
    try {
      if (path) await deleteImage(path);
      setFotos((prev) => {
        const next = [...prev];
        next[slot] = "";
        return next;
      });
      toast.success("Foto quitada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar");
    } finally {
      setBusy(null);
    }
  };

  const onSave = async () => {
    setBusy("save");
    try {
      await saveInicioConfig({
        titulo,
        descripcion,
        fotos: fotos.filter(Boolean),
      });
      toast.success("Inicio guardado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-nautico-900/10 bg-white p-6 shadow-sm">
      <div>
        <Label htmlFor="inicio-titulo">Título</Label>
        <Input
          id="inicio-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="mt-1"
          placeholder="Título de la sección"
        />
      </div>
      <div>
        <Label htmlFor="inicio-desc">Descripción</Label>
        <Textarea
          id="inicio-desc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1 min-h-[160px] resize-y"
          placeholder="Texto largo (podés usar saltos de línea)"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Fotos (grilla 2×2)</Label>
          <span className="text-sm text-nautico-600">
            {occupied}/4 fotos
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-nautico-900/20 bg-nautico-900/5"
            >
              {fotos[slot] ? (
                <>
                  <Image
                    src={fotos[slot]}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 200px"
                    unoptimized
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute right-1 top-1 h-8 w-8"
                    disabled={busy !== null}
                    onClick={() => void clearSlot(slot)}
                  >
                    {busy === `cl-${slot}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 p-4 text-center text-sm text-nautico-600">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={busy !== null}
                    onChange={pickForSlot(slot)}
                  />
                  <ImagePlus className="h-8 w-8" />
                  <span>Foto {slot + 1}</span>
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      {slotFile !== null && file ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-nautico-900/10 p-4">
          <span className="text-sm text-nautico-700">Slot {slotFile + 1}: {file.name}</span>
          <Button
            type="button"
            className="bg-nautico-900 text-white hover:bg-nautico-800"
            disabled={busy !== null}
            onClick={() => void uploadToSlot()}
          >
            {busy === `up-${slotFile}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir a este lugar
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        className="bg-nautico-900 text-white hover:bg-nautico-800"
        disabled={busy !== null || !titulo.trim()}
        onClick={() => void onSave()}
      >
        {busy === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Guardar
      </Button>
    </div>
  );
}
