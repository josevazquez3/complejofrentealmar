"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { eliminarCasa, setCasaActiva } from "@/app/actions/casas";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { Casa } from "@/types";
import { CasaFormModal } from "./CasaFormModal";

export function CasasAdminView({
  initialCasas,
  children,
}: {
  initialCasas: Casa[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Casa | null>(null);

  async function toggle(id: string, activa: boolean) {
    setBusyId(id);
    const res = await setCasaActiva(id, activa);
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(activa ? "Casa activada" : "Casa desactivada");
    router.refresh();
  }

  function openCreate() {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(c: Casa) {
    setModalMode("edit");
    setEditing(c);
    setModalOpen(true);
  }

  async function handleDelete(c: Casa) {
    if (
      !window.confirm(
        `¿Eliminar la casa "${c.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    const res = await eliminarCasa(c.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Casa eliminada");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">{children}</div>
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 rounded-xl bg-nautico-800 px-4 py-3 text-sm font-semibold text-white hover:bg-arena-600 hover:text-nautico-900"
        >
          + Nueva casa
        </button>
      </div>

      <CasaFormModal
        open={modalOpen}
        mode={modalMode}
        casa={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => router.refresh()}
      />

      {initialCasas.length === 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-nautico-900">
          <p className="font-medium">Todavía no hay casas en la base.</p>
          <p className="mt-2 text-nautico-800/90">
            Usá <strong>+ Nueva casa</strong> para crear la primera. Las reservas públicas y el listado de casas usan
            este modelo (tabla <code className="rounded bg-white px-1">casas</code>), no las unidades de marketing del
            inicio.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nautico-900/10">
          <Table>
            <TableHeader>
              <TableRow className="bg-nautico-900/5">
                <TableHead>Nombre</TableHead>
                <TableHead className="w-28 text-center">Capacidad</TableHead>
                <TableHead className="w-40 text-center">Activa</TableHead>
                <TableHead className="w-28 text-center">Ficha</TableHead>
                <TableHead className="w-40 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialCasas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-nautico-900">{c.nombre}</TableCell>
                  <TableCell className="text-center text-nautico-700">{c.capacidad_personas}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Checkbox
                        id={`activa-${c.id}`}
                        checked={Boolean(c.activa)}
                        disabled={busyId === c.id}
                        onCheckedChange={(v) => toggle(c.id, v === true)}
                      />
                      <Label htmlFor={`activa-${c.id}`} className="cursor-pointer text-sm font-normal text-nautico-800">
                        {c.activa ? "Sí" : "No"}
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Link
                      href={`/casas/${c.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-nautico-800 underline-offset-4 hover:text-arena-600 hover:underline"
                    >
                      Ver <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="mr-2 inline-flex items-center gap-1 rounded-lg border border-nautico-900/15 px-2 py-1.5 text-xs font-medium text-nautico-800 hover:bg-nautico-900/5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(c)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
