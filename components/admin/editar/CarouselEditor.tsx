"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Film, ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  deleteImage,
  saveCarouselImages,
  uploadImage,
} from "@/app/actions/configuracion";
import { Button } from "@/components/ui/button";
import type { CarouselImage } from "@/types/configuracion";
import { cn } from "@/lib/utils";

const MAX = 6;
const MAX_VIDEO_SECONDS = 7;

type Row = CarouselImage;
type FileMode = "image" | "video";

export function CarouselEditor({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    [...initial].sort((a, b) => a.orden - b.orden)
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileMode, setFileMode] = useState<FileMode>("image");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertedGif, setConvertedGif] = useState<File | null>(null);
  const [gifPreview, setGifPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  useEffect(() => {
    if (!convertedGif) {
      setGifPreview(null);
      return;
    }
    const u = URL.createObjectURL(convertedGif);
    setGifPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [convertedGif]);

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFileMode("image");
    setFile(f);
    setConvertedGif(null);
  };

  const onPickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFileMode("video");
    setFile(f);
    setConvertedGif(null);
  };

  const validateVideoDuration = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve(false);
      if (videoRef.current.readyState >= 1) {
        resolve(videoRef.current.duration <= MAX_VIDEO_SECONDS);
        return;
      }
      const onMeta = () => {
        const dur = videoRef.current!.duration;
        resolve(dur <= MAX_VIDEO_SECONDS);
      };
      videoRef.current.addEventListener("loadedmetadata", onMeta, { once: true });
    });
  };

   const convertToGif = useCallback(async (trimToMax = false) => {
    if (!file) return;
    setConverting(true);
    try {
      const valid = await validateVideoDuration();
      if (!valid && !trimToMax) {
        setConverting(false);
        const confirmed = window.confirm(
          `Su video dura más de ${MAX_VIDEO_SECONDS} segundos. ¿Desea conservar solo los primeros ${MAX_VIDEO_SECONDS} segundos?`
        );
        if (!confirmed) return;
        void convertToGif(true);
        return;
      }

      // Importar ffmpeg dinámicamente
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();

      // Cargar core desde CDN (evita bundlear los WASM pesados)
      const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      toast.info("Convirtiendo a GIF...");

      await ffmpeg.writeFile("input.mp4", await fetchFile(file));

      const trimArgs = trimToMax ? ["-t", String(MAX_VIDEO_SECONDS)] : [];
      await ffmpeg.exec([
        "-i", "input.mp4",
        ...trimArgs,
        "-vf", "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
        "-loop", "0",
        "output.gif",
      ]);

      const data = await ffmpeg.readFile("output.gif");
      const blob = new Blob([data as unknown as Uint8Array<ArrayBuffer>], { type: "image/gif" });
      const gifFile = new File([blob], file.name.replace(/\.mp4$/i, ".gif"), {
        type: "image/gif",
      });

      setConvertedGif(gifFile);
      toast.success("Conversión lista. Revisá el GIF y subilo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al convertir");
    } finally {
      setConverting(false);
    }
  }, [file]);

  const onUpload = useCallback(async (overrideFile?: File) => {
    const toUpload = overrideFile ?? file;
    if (!toUpload || rows.length >= MAX) return;
    setBusy("upload");
    try {
      const isGif = toUpload.type === "image/gif";
      let url: string;
      let pathKey: string;

      if (isGif) {
        // GIFs: client-side upload directo a Vercel Blob (evita límite 4.5MB de server actions)
        const { upload } = await import("@vercel/blob/client");
        const pathname = `carousel/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.gif`;
        const blob = await upload(pathname, toUpload, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        });
        url = blob.url;
        pathKey = blob.url;
      } else {
        // Imágenes normales: server action de siempre
        const fd = new FormData();
        fd.append("file", toUpload);
        fd.append("folder", "carousel");
        const result = await uploadImage(fd);
        url = result.url;
        pathKey = result.path;
      }

      const nextOrden = rows.length ? Math.max(...rows.map((r) => r.orden)) + 1 : 0;
      setRows((prev) => [
        ...prev,
        {
          id: `temp-${pathKey}`,
          url,
          storage_path: pathKey,
          orden: nextOrden,
          created_at: new Date().toISOString(),
        },
      ]);
      setFile(null);
      setConvertedGif(null);
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

  const reset = () => {
    setFile(null);
    setConvertedGif(null);
  };

  return (
    <div className="space-y-6 rounded-xl border border-nautico-900/10 bg-white p-6 shadow-sm">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-nautico-700">
          Imágenes/GIFs: <strong>{rows.length}</strong> / {MAX}
        </p>
        <div className="flex flex-wrap items-center gap-2">

          {/* Botón agregar foto/gif */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*,.gif"
              className="sr-only"
              disabled={rows.length >= MAX || busy !== null}
              onChange={onPickImage}
            />
            <span className="inline-flex items-center gap-2 rounded-lg border border-nautico-900/20 bg-white px-3 py-2 text-sm font-medium text-nautico-900 hover:bg-nautico-900/5">
              <ImagePlus className="h-4 w-4" />
              Foto / GIF
            </span>
          </label>

          {/* Botón agregar video */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="video/mp4"
              className="sr-only"
              disabled={rows.length >= MAX || busy !== null}
              onChange={onPickVideo}
            />
            <span className="inline-flex items-center gap-2 rounded-lg border border-nautico-900/20 bg-white px-3 py-2 text-sm font-medium text-nautico-900 hover:bg-nautico-900/5">
              <Film className="h-4 w-4" />
              Video MP4 → GIF
            </span>
          </label>

          {/* Acciones cuando hay archivo seleccionado */}
          {file && fileMode === "image" && (
            <>
              <Button
                type="button"
                className="bg-nautico-900 text-white hover:bg-nautico-800"
                disabled={busy !== null}
                onClick={() => void onUpload()}
              >
                {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Subir
              </Button>
              <Button type="button" variant="outline" disabled={busy !== null} onClick={reset}>
                <X className="mr-1 h-4 w-4" /> Cancelar
              </Button>
            </>
          )}

          {file && fileMode === "video" && !convertedGif && (
            <>
              <Button
                type="button"
                className="bg-nautico-900 text-white hover:bg-nautico-800"
                disabled={converting}
                onClick={() => void convertToGif()}
              >
                {converting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
                {converting ? "Convirtiendo..." : "Convertir a GIF"}
              </Button>
              <Button type="button" variant="outline" disabled={converting} onClick={reset}>
                <X className="mr-1 h-4 w-4" /> Cancelar
              </Button>
            </>
          )}

          {convertedGif && (
            <>
              <Button
                type="button"
                className="bg-nautico-900 text-white hover:bg-nautico-800"
                disabled={busy !== null}
                onClick={() => void onUpload(convertedGif)}
              >
                {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Subir GIF
              </Button>
              <Button type="button" variant="outline" disabled={busy !== null} onClick={reset}>
                <X className="mr-1 h-4 w-4" /> Descartar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Preview imagen/gif */}
      {preview && fileMode === "image" && (
        <div className="relative mx-auto aspect-video max-h-48 w-full max-w-md overflow-hidden rounded-lg border bg-nautico-900/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-full w-full object-contain" />
        </div>
      )}

      {/* Preview video + elemento oculto para leer duración */}
      {preview && fileMode === "video" && (
        <div className="relative mx-auto aspect-video max-h-48 w-full max-w-md overflow-hidden rounded-lg border bg-nautico-900/5">
          <video
            ref={videoRef}
            src={preview}
            className="h-full w-full object-contain"
            controls
            muted
          />
          <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            Máx. {MAX_VIDEO_SECONDS}s
          </span>
        </div>
      )}

      {/* Preview GIF convertido */}
      {gifPreview && (
        <div className="space-y-2">
          <p className="text-center text-xs text-nautico-600">GIF generado — revisá antes de subir</p>
          <div className="relative mx-auto aspect-video max-h-48 w-full max-w-md overflow-hidden rounded-lg border border-green-200 bg-nautico-900/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gifPreview} alt="" className="h-full w-full object-contain" />
          </div>
        </div>
      )}

      {/* Grid de slides actuales */}
      <ul className="grid gap-4 sm:grid-cols-2">
        {rows.map((row, i) => (
          <li
            key={row.storage_path}
            className="flex gap-3 overflow-hidden rounded-lg border border-nautico-900/10 p-3"
          >
            <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md bg-nautico-900/10">
              {row.url.endsWith(".gif") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Image src={row.url} alt="" fill className="object-cover" sizes="128px" unoptimized />
              )}
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">
                #{i + 1}
              </span>
              {row.url.endsWith(".gif") && (
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 text-xs text-white">
                  GIF
                </span>
              )}
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
              <p className="w-0 min-w-full truncate text-xs text-nautico-600">{row.storage_path}</p>
            </div>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="text-sm text-nautico-600">No hay imágenes. Subí al menos una para el carrusel.</p>
      )}

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