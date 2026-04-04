"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReservaListaItem, TesoreriaConRelaciones } from "@/types";
import { formatCurrencyAR, formatDateAR, parseARSInput } from "@/lib/format";
import { exportToExcel } from "@/lib/excel";
import { deleteTesoreria, upsertTesoreria } from "@/app/admin/actions/tesoreria";
import { uploadAdminComprobante } from "@/app/admin/actions/upload-comprobante";
import { ComprobanteLink } from "./ComprobanteLink";

type CasaOpt = { id: string; nombre: string };

export function TesoreriaTable({
  casas,
  reservas,
  initialRows,
}: {
  casas: CasaOpt[];
  reservas: ReservaListaItem[];
  initialRows: TesoreriaConRelaciones[];
}) {
  const [rows, setRows] = useState<TesoreriaConRelaciones[]>(initialRows);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | undefined>();
  const [casaId, setCasaId] = useState<string>("");
  const [reservaId, setReservaId] = useState<string>("");
  const [diferenciaStr, setDiferenciaStr] = useState("");
  const [saldoStr, setSaldoStr] = useState("");
  const [comprobantePath, setComprobantePath] = useState<string | null>(null);

  function reservaLabel(r: ReservaListaItem): string {
    const c = r.casas?.nombre ? `${r.casas.nombre} · ` : "";
    return `${c}${formatDateAR(r.fecha_desde)} – ${formatDateAR(r.fecha_hasta)}`;
  }

  function resetForm() {
    setEditingId(undefined);
    setCasaId(casas[0]?.id ?? "");
    setReservaId(reservas[0]?.id ?? "");
    setDiferenciaStr("");
    setSaldoStr("");
    setComprobantePath(null);
  }

  function openNew() {
    resetForm();
    setOpen(true);
  }

  function openEdit(t: TesoreriaConRelaciones) {
    setEditingId(t.id);
    setCasaId(t.casa_id ?? casas[0]?.id ?? "");
    setReservaId(t.reserva_id ?? reservas[0]?.id ?? "");
    setDiferenciaStr(
      t.diferencia != null ? String(t.diferencia).replace(".", ",") : ""
    );
    setSaldoStr(t.saldo != null ? String(t.saldo).replace(".", ",") : "");
    setComprobantePath(t.comprobante_url);
    setOpen(true);
  }

  async function uploadFile(file: File | null): Promise<string | null> {
    if (!file) return null;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["jpg", "jpeg", "pdf"].includes(ext)) {
      toast.error("Solo .jpg, .jpeg o .pdf");
      return null;
    }
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadAdminComprobante(fd);
    setUploading(false);
    if (!res.ok) {
      toast.error(res.message);
      return null;
    }
    toast.success("Comprobante subido");
    return res.url;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const diferencia = diferenciaStr.trim() ? parseARSInput(diferenciaStr) : null;
    const saldo = saldoStr.trim() ? parseARSInput(saldoStr) : null;

    const res = await upsertTesoreria({
      id: editingId,
      casa_id: casaId || null,
      reserva_id: reservaId || null,
      diferencia,
      saldo,
      comprobante_url: comprobantePath,
    });

    if (!res.ok) {
      toast.error(res.message ?? "Error al guardar");
      return;
    }
    toast.success(editingId ? "Movimiento actualizado" : "Movimiento creado");
    setOpen(false);
    window.location.reload();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await deleteTesoreria(deleteId);
    if (!res.ok) {
      toast.error(res.message ?? "Error al eliminar");
      return;
    }
    toast.success("Registro eliminado");
    setRows((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleteId(null);
  }

  function exportExcel() {
    const data = rows.map((r) => ({
      Casa: r.casas?.nombre ?? "—",
      Reserva: r.reservas
        ? `${formatDateAR(r.reservas.fecha_desde)} – ${formatDateAR(r.reservas.fecha_hasta)}`
        : "—",
      Diferencia: r.diferencia ?? "",
      Saldo: r.saldo ?? "",
    }));
    exportToExcel(data, "tesoreria.xlsx", "Tesorería");
    toast.success("Archivo generado");
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-nautico-900">Tesorería</h1>
          <p className="text-sm text-nautico-700/80">Movimientos y comprobantes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportExcel}>
            Exportar Excel
          </Button>
          <Button onClick={openNew} className="bg-nautico-800 text-blanco hover:bg-arena-600">
            Nuevo registro
          </Button>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-nautico-900/10">
        <Table>
          <TableHeader>
            <TableRow className="bg-nautico-900/5">
              <TableHead>Casa</TableHead>
              <TableHead>Reserva</TableHead>
              <TableHead>Diferencia</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin movimientos
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.casas?.nombre ?? "—"}</TableCell>
                  <TableCell>
                    {r.reservas
                      ? `${formatDateAR(r.reservas.fecha_desde)} – ${formatDateAR(r.reservas.fecha_hasta)}`
                      : "—"}
                  </TableCell>
                  <TableCell>{formatCurrencyAR(r.diferencia ?? null)}</TableCell>
                  <TableCell>
                    <ComprobanteLink pathOrUrl={r.comprobante_url} />
                  </TableCell>
                  <TableCell>{formatCurrencyAR(r.saldo ?? null)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(r)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => setDeleteId(r.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={onSave}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar movimiento" : "Nuevo movimiento"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Casa</Label>
                <Select
                  value={casaId || "__none__"}
                  onValueChange={(v) => setCasaId(v === "__none__" || v == null ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {casas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Reserva</Label>
                <Select
                  value={reservaId || "__none__"}
                  onValueChange={(v) => setReservaId(v === "__none__" || v == null ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {reservas.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {reservaLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Diferencia (ARS)</Label>
                <Input value={diferenciaStr} onChange={(e) => setDiferenciaStr(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Saldo (ARS)</Label>
                <Input value={saldoStr} onChange={(e) => setSaldoStr(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Comprobante</Label>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
                  disabled={uploading}
                  onChange={async (e) => {
                    const p = await uploadFile(e.target.files?.[0] ?? null);
                    if (p) setComprobantePath(p);
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
