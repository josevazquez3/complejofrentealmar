"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Casa, ReservaConCasa } from "@/types";
import { formatFecha, formatMoneda } from "@/lib/format";
import { exportReservas } from "@/lib/excel";
import { eliminarReserva, fetchReservasForExport } from "@/app/admin/(panel)/reservas/actions";
import { PaginationBar } from "./PaginationBar";
import { ReservaComprobanteCell } from "./ReservaComprobanteCell";
import { ReservaModal } from "./ReservaModal";

function mascotasLabel(m: number | null | undefined): string {
  if (m == null || m === 0) return "—";
  if (m >= 4) return "4+";
  return String(m);
}

export function ReservasClient({
  initialRows,
  currentPage,
  totalPages,
  total,
  casas,
}: {
  initialRows: ReservaConCasa[];
  currentPage: number;
  totalPages: number;
  total: number;
  casas: Casa[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReservaConCasa | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exporting, startExport] = useTransition();
  const [deleting, startDelete] = useTransition();

  const offset = (currentPage - 1) * 10;

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(r: ReservaConCasa) {
    setEditing(r);
    setModalOpen(true);
  }

  function onExport() {
    startExport(async () => {
      const all = await fetchReservasForExport();
      if (all.length === 0) {
        toast.error("No hay reservas para exportar");
        return;
      }
      exportReservas(all);
      toast.success("Excel generado");
    });
  }

  function confirmDelete() {
    if (!deleteId) return;
    startDelete(async () => {
      const res = await eliminarReserva(deleteId);
      if (res.success) {
        toast.success("Reserva eliminada");
        router.refresh();
      } else {
        toast.error(res.error ?? "No se pudo eliminar");
      }
      setDeleteId(null);
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-nautico-900">Reservas</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={exporting}
            onClick={onExport}
          >
            Exportar Excel
          </Button>
          <Button
            type="button"
            className="bg-nautico-800 text-blanco hover:bg-arena-600"
            onClick={openNew}
          >
            + Nueva Reserva
          </Button>
        </div>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        {total} reserva{total !== 1 ? "s" : ""} en total
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-nautico-900/10">
        <Table>
          <TableHeader>
            <TableRow className="bg-nautico-900/5">
              <TableHead className="w-10">#</TableHead>
              <TableHead>Fecha Desde</TableHead>
              <TableHead>Fecha Hasta</TableHead>
              <TableHead>Casa</TableHead>
              <TableHead>Personas</TableHead>
              <TableHead>Mascotas</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No hay reservas en esta página
                </TableCell>
              </TableRow>
            ) : (
              initialRows.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{offset + i + 1}</TableCell>
                  <TableCell>{formatFecha(r.fecha_desde)}</TableCell>
                  <TableCell>{formatFecha(r.fecha_hasta)}</TableCell>
                  <TableCell>{r.casas?.nombre ?? "—"}</TableCell>
                  <TableCell>{r.cant_personas}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {mascotasLabel(r.mascotas)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ReservaComprobanteCell pathOrUrl={r.comprobante_url} />
                  </TableCell>
                  <TableCell>{formatMoneda(r.saldo_reserva ?? null)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-amber-600 hover:text-amber-700"
                      aria-label="Editar"
                      onClick={() => openEdit(r)}
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      aria-label="Eliminar"
                      onClick={() => setDeleteId(r.id)}
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Suspense fallback={<div className="mt-6 h-10 animate-pulse rounded bg-muted" />}>
        <PaginationBar currentPage={currentPage} totalPages={totalPages} />
      </Suspense>

      <ReservaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => router.refresh()}
        reserva={editing}
        casas={casas}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
