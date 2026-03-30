"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deleteImage,
  saveCarouselImages,
  uploadImage,
} from "@/app/actions/configuracion";
import { Button } from "@/components/ui/button";
import type { CarouselImage } from "@/types/configuracion";
import { cn } from "@/lib/utils";

const MAX = 10;

type Row = CarouselImage;

export function CarouselEditor({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    [...initial].sort((a, b) => a.orden - b.orden)
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setRows([...initial].sort((a, b) => a.orden - b.orden));
  }, [initial]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) setFile(f);
  };

  const onUpload = useCallback(async () => {
    if (!file || rows.length >= MAX) return;
    setBusy("upload");
    try {
      const { url, path } = await uploadImage(file, "carousel");
      const nextOrden = rows.length ? Math.max(...rows.map((r) => r.orden)) + 1 : 0;
      setRows((prev) => [
        ...prev,
        {
          id: `temp-${path}`,
          url,
          storage_path: path,
          orden: nextOrden,
          created_at: new Date().toISOString(),
        },
      ]);
      setFile(null);
      toast.success("Imagen subida. Guardá el orden para persistir en la base.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir");
    } finally {
      setBusy(null);
    }
  }, [file, rows]);

  const removeAt = async (index: number) => {
    const row = rows[index];
    if (!row) return;
    setBusy(`rm-${row.storage_path}`);
    try {
      await deleteImage(row.storage_path);
      setRows((prev) => prev.filter((_, i) => i !== index));
      toast.success("Imagen eliminada del storage.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar");
    } finally {
      setBusy(null);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const onSaveOrder = async () => {
    if (rows.length === 0) {
      toast.error("Agregá al menos una imagen.");
      return;
    }
    setBusy("save");
    try {
      const payload = rows.map((r, i) => ({
        url: r.url,
        path: r.storage_path,
        orden: i,
      }));
      await saveCarouselImages(payload);
      toast.success("Carrusel guardado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-nautico-900/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-nautico-700">
          Imágenes: <strong>{rows.length}</strong> / {MAX}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={rows.length >= MAX || busy !== null}
              onChange={onPick}
            />
            <span className="inline-flex items-center gap-2 rounded-lg border border-nautico-900/20 bg-white px-3 py-2 text-sm font-medium text-nautico-900 hover:bg-nautico-900/5">
              <ImagePlus className="h-4 w-4" />
              Agregar foto
            </span>
          </label>
          {file ? (
            <Button
              type="button"
              className="bg-nautico-900 text-white hover:bg-nautico-800"
              disabled={busy !== null}
              onClick={() => void onUpload()}
            >
              {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Subir
            </Button>
          ) : null}
        </div>
      </div>

      {preview ? (
        <div className="relative mx-auto aspect-video max-h-48 w-full max-w-md overflow-hidden rounded-lg border bg-nautico-900/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-full w-full object-contain" />
        </div>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        {rows.map((row, i) => (
          <li
            key={row.storage_path}
            className="flex gap-3 rounded-lg border border-nautico-900/10 p-3"
          >
            <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md bg-nautico-900/10">
              <Image src={row.url} alt="" fill className="object-cover" sizes="128px" unoptimized />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">
                #{i + 1}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={i === 0 || busy !== null}
                  onClick={() => move(i, -1)}
                  aria-label="Subir orden"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={i === rows.length - 1 || busy !== null}
                  onClick={() => move(i, 1)}
                  aria-label="Bajar orden"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  disabled={busy !== null}
                  onClick={() => void removeAt(i)}
                  aria-label="Quitar"
                >
                  {busy === `rm-${row.storage_path}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="truncate text-xs text-nautico-600">{row.storage_path}</p>
            </div>
          </li>
        ))}
      </ul>

      {rows.length === 0 ? (
        <p className="text-sm text-nautico-600">No hay imágenes. Subí al menos una para el carrusel.</p>
      ) : null}

      <Button
        type="button"
        className={cn("bg-nautico-900 text-white hover:bg-nautico-800")}
        disabled={busy !== null || rows.length === 0}
        onClick={() => void onSaveOrder()}
      >
        {busy === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Guardar orden
      </Button>
    </div>
  );
}
