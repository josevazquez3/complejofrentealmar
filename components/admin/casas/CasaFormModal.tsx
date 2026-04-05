"use client";

import { useEffect, useRef, useState } from "react";
import { crearCasa, editarCasa } from "@/app/actions/casas";
import type { Casa } from "@/types";

type Mode = "create" | "edit";

export function CasaFormModal({
  open,
  mode,
  casa,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: Mode;
  casa: Casa | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [capacidad, setCapacidad] = useState(4);
  const [activa, setActiva] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && casa) {
      setNombre(casa.nombre);
      setDescripcion(casa.descripcion ?? "");
      setCapacidad(casa.capacidad_personas);
      setActiva(Boolean(casa.activa));
    } else {
      setNombre("");
      setDescripcion("");
      setCapacidad(4);
      setActiva(true);
    }
  }, [open, mode, casa]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) {
      if (!d.open) d.showModal();
    } else if (d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      if (submitting) e.preventDefault();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [submitting]);

  function handleDialogCloseEvent() {
    if (submitting) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "create") {
        const res = await crearCasa({
          nombre,
          descripcion,
          capacidad,
          activa,
        });
        if (!res.ok) {
          setError(res.error);
          setSubmitting(false);
          return;
        }
      } else {
        if (!casa) {
          setError("Falta la casa a editar.");
          setSubmitting(false);
          return;
        }
        const res = await editarCasa({
          id: casa.id,
          nombre,
          descripcion,
          capacidad,
          activa,
        });
        if (!res.ok) {
          setError(res.error);
          setSubmitting(false);
          return;
        }
      }
      setSubmitting(false);
      onSaved();
      dialogRef.current?.close();
      onClose();
    } catch {
      setError("Error inesperado.");
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-md rounded-xl border border-nautico-900/20 bg-white p-0 text-nautico-900 shadow-xl backdrop:bg-black/40"
      onClose={handleDialogCloseEvent}
      onClick={(e) => {
        if (submitting) return;
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-nautico-900/10 px-5 py-4">
          <h2 className="font-display text-lg font-semibold">
            {mode === "create" ? "Nueva casa" : "Editar casa"}
          </h2>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="casa-nombre" className="mb-1 block text-sm font-medium text-nautico-800">
              Nombre <span className="text-red-600">*</span>
            </label>
            <input
              id="casa-nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-nautico-900/20 px-3 py-2 text-sm outline-none ring-nautico-800 focus:ring-2 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="casa-desc" className="mb-1 block text-sm font-medium text-nautico-800">
              Descripción
            </label>
            <textarea
              id="casa-desc"
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={submitting}
              className="w-full resize-y rounded-lg border border-nautico-900/20 px-3 py-2 text-sm outline-none ring-nautico-800 focus:ring-2 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="casa-cap" className="mb-1 block text-sm font-medium text-nautico-800">
              Capacidad (personas) <span className="text-red-600">*</span>
            </label>
            <input
              id="casa-cap"
              type="number"
              required
              min={1}
              step={1}
              value={Number.isFinite(capacidad) ? capacidad : ""}
              onChange={(e) => setCapacidad(Number(e.target.value))}
              disabled={submitting}
              className="w-full rounded-lg border border-nautico-900/20 px-3 py-2 text-sm outline-none ring-nautico-800 focus:ring-2 disabled:opacity-60 sm:max-w-[8rem]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="casa-activa"
              type="checkbox"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-nautico-900/30 text-nautico-800"
            />
            <label htmlFor="casa-activa" className="text-sm text-nautico-800">
              Activa (visible en sitio y reservas)
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-nautico-900/10 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={submitting}
            className="rounded-lg border border-nautico-900/20 px-4 py-2.5 text-sm font-medium text-nautico-800 hover:bg-nautico-900/5 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-nautico-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-arena-600 hover:text-nautico-900 disabled:opacity-60"
          >
            {submitting ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
