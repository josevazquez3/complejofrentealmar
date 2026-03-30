"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { saveSeccionTexto } from "@/app/actions/configuracion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SeccionTexto, SeccionTextoId } from "@/types/configuracion";

export function SeccionTextoEditor({
  id,
  initial,
}: {
  id: SeccionTextoId;
  initial: SeccionTexto;
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(initial.titulo);
  const [descripcion, setDescripcion] = useState(initial.descripcion);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTitulo(initial.titulo);
    setDescripcion(initial.descripcion);
    setSaved(false);
  }, [initial.titulo, initial.descripcion, initial.updated_at]);

  async function onSave() {
    setBusy(true);
    setSaved(false);
    try {
      await saveSeccionTexto(id, { titulo, descripcion });
      setSaved(true);
      router.refresh();
    } catch (e) {
      setSaved(false);
      alert(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col rounded-xl border border-nautico-900/10 bg-white shadow-sm">
      <div className="min-w-0 space-y-4 px-4 pb-2 pt-3 sm:px-6 sm:pt-4">
        <div className="w-full min-w-0">
          <Label htmlFor={`sec-${id}-titulo`}>Título</Label>
          <Input
            id={`sec-${id}-titulo`}
            value={titulo}
            onChange={(e) => {
              setTitulo(e.target.value);
              setSaved(false);
            }}
            className="mt-1 w-full min-w-0"
          />
        </div>
        <div className="w-full min-w-0">
          <Label htmlFor={`sec-${id}-desc`}>Descripción</Label>
          <Textarea
            id={`sec-${id}-desc`}
            value={descripcion}
            onChange={(e) => {
              setDescripcion(e.target.value);
              setSaved(false);
            }}
            className="mt-1 min-h-[220px] w-full min-w-0 resize-y sm:min-h-[260px]"
          />
        </div>
      </div>

      <div className="mt-2 border-t border-nautico-900/10 bg-nautico-900/[0.02] px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="bg-nautico-900 text-white hover:bg-nautico-800"
            disabled={busy || !titulo.trim()}
            onClick={() => void onSave()}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar
          </Button>
          {saved ? (
            <span className="text-sm font-medium text-green-700">Guardado correctamente ✓</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
