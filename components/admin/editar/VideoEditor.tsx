"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractYoutubeVideoId } from "@/lib/youtube-id";

export function VideoEditor({ initialYoutubeId }: { initialYoutubeId: string | null }) {
  const router = useRouter();
  const [input, setInput] = useState(() => initialYoutubeId?.trim() ?? "");
  const [savedId, setSavedId] = useState<string | null>(() => initialYoutubeId?.trim() || null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = initialYoutubeId?.trim() || null;
    setInput(id ?? "");
    setSavedId(id);
  }, [initialYoutubeId]);

  async function onSave() {
    const trimmed = input.trim();
    if (trimmed !== "" && !extractYoutubeVideoId(trimmed)) {
      toast.error("No se pudo interpretar el ID o la URL de YouTube.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeVideoId: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; youtubeVideoId?: string | null };
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo guardar.");
        return;
      }
      const next = data.youtubeVideoId ?? null;
      setSavedId(next);
      setInput(next ?? "");
      toast.success("Video institucional guardado.");
      router.refresh();
    } catch {
      toast.error("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col rounded-xl border border-nautico-900/10 bg-white shadow-sm">
      <div className="min-w-0 space-y-5 px-4 py-4 sm:px-6">
        <div className="space-y-2">
          <Label htmlFor="youtube_video">ID o URL del video de YouTube</Label>
          <Input
            id="youtube_video"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="dQw4w9WgXcQ o https://www.youtube.com/watch?v=…"
            autoComplete="off"
            className="max-w-xl"
          />
          <p className="text-xs text-nautico-700/75">
            Podés pegar el ID de 11 caracteres o un enlace de watch, youtu.be o embed. Dejá vacío para ocultar el
            video en el sitio público.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={onSave} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Guardando…
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-nautico-900">Vista previa (tras guardar)</p>
          {savedId ? (
            <div className="max-w-2xl overflow-hidden rounded-lg border border-nautico-900/15 shadow-sm">
              <div className="aspect-video w-full bg-nautico-950/5">
                <iframe
                  title="Vista previa video institucional"
                  src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(savedId)}?rel=0`}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          ) : (
            <div className="flex max-w-2xl flex-col items-center justify-center rounded-lg border border-dashed border-nautico-900/20 bg-nautico-50/80 px-4 py-10 text-center text-sm text-nautico-700/80">
              No hay video guardado. Guardá un ID o URL válidos para ver la vista previa aquí y en la home.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
