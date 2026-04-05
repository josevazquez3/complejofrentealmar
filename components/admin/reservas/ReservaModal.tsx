"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Casa, Reserva } from "@/types";
import { parseARSInput } from "@/lib/format";
import { crearReserva, editarReserva } from "@/app/admin/(panel)/reservas/actions";

const MAX_BYTES = 5 * 1024 * 1024;

function todayYmd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mascotasToSelect(m: number | null | undefined): string {
  return String(Math.min(5, Math.max(0, m ?? 0)));
}

export interface ReservaModalProps {
  open: boolean;
  onClose: () => void;
  /** Tras guardado exitoso (para `router.refresh()`). */
  onSuccess?: () => void;
  reserva: Reserva | null;
  casas: Casa[];
}

export function ReservaModal({ open, onClose, onSuccess, reserva, casas }: ReservaModalProps) {
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(reserva);

  const [casaId, setCasaId] = useState(casas[0]?.id ?? "");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [adultos, setAdultos] = useState(2);
  const [ninos, setNinos] = useState(0);
  const [mascotas, setMascotas] = useState("0");
  const [saldoStr, setSaldoStr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [keepComprobante, setKeepComprobante] = useState(true);

  const capacidad = useMemo(() => {
    const c = casas.find((x) => x.id === casaId);
    return c?.capacidad_personas ?? 0;
  }, [casas, casaId]);

  useEffect(() => {
    if (!open) return;
    if (reserva) {
      setCasaId(reserva.casa_id);
      setFechaDesde(reserva.fecha_desde);
      setFechaHasta(reserva.fecha_hasta);
      setAdultos(reserva.adultos);
      setNinos(reserva.ninos);
      setMascotas(mascotasToSelect(reserva.mascotas));
      setSaldoStr(
        reserva.saldo_reserva != null
          ? String(reserva.saldo_reserva).replace(".", ",")
          : ""
      );
      setFile(null);
      setPreviewUrl(null);
      setKeepComprobante(true);
    } else {
      setCasaId(casas[0]?.id ?? "");
      setFechaDesde("");
      setFechaHasta("");
      setAdultos(2);
      setNinos(0);
      setMascotas("0");
      setSaldoStr("");
      setFile(null);
      setPreviewUrl(null);
      setKeepComprobante(true);
    }
  }, [open, reserva, casas]);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl((u) => {
        if (u) URL.revokeObjectURL(u);
        return null;
      });
      return;
    }
    const u = URL.createObjectURL(file);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  function onFileChange(f: File | null) {
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("El archivo supera 5 MB");
      return;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!ext || !["jpg", "jpeg", "pdf"].includes(ext)) {
      toast.error("Solo .jpg, .jpeg o .pdf");
      return;
    }
    setFile(f);
    if (isEdit) setKeepComprobante(false);
  }

  function onSaldoBlur() {
    const n = parseARSInput(saldoStr);
    if (n != null) {
      setSaldoStr(
        new Intl.NumberFormat("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(n)
      );
    }
  }

  function validate(): string | null {
    if (!casaId) return "Elegí una casa.";
    if (!fechaDesde || !fechaHasta) return "Completá las fechas.";
    if (fechaHasta <= fechaDesde) return "La fecha hasta debe ser posterior a la fecha desde.";
    if (!isEdit && fechaDesde < todayYmd()) return "La fecha desde no puede ser anterior a hoy.";
    if (!Number.isFinite(adultos) || adultos < 1 || adultos > 10) {
      return "Adultos: entre 1 y 10.";
    }
    if (!Number.isFinite(ninos) || ninos < 0 || ninos > 10) {
      return "Niños: entre 0 y 10.";
    }
    const total = adultos + ninos;
    if (capacidad > 0 && total > capacidad) {
      return `Adultos + niños no puede superar ${capacidad} (capacidad de la casa).`;
    }
    const m = Number.parseInt(mascotas, 10);
    if (!Number.isFinite(m) || m < 0 || m > 5) {
      return "Mascotas: entre 0 y 5.";
    }
    return null;
  }

  function submit() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const fd = new FormData();
    fd.set("casa_id", casaId);
    fd.set("fecha_desde", fechaDesde);
    fd.set("fecha_hasta", fechaHasta);
    fd.set("adultos", String(adultos));
    fd.set("ninos", String(ninos));
    fd.set("mascotas", mascotas);
    fd.set("saldo_reserva", saldoStr);
    if (file) fd.set("comprobante", file);
    if (isEdit && reserva) {
      fd.set("id", reserva.id);
      fd.set("keep_comprobante", keepComprobante && !file ? "1" : "0");
    }

    startTransition(async () => {
      const res = isEdit ? await editarReserva(fd) : await crearReserva(fd);
      if (res.success) {
        toast.success(isEdit ? "Reserva actualizada" : "Reserva creada");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error ?? "Error al guardar");
      }
    });
  }

  const existingUrl = reserva?.comprobante_url;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar reserva" : "Nueva reserva"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Fecha desde</Label>
            <Input
              type="date"
              value={fechaDesde}
              min={isEdit ? undefined : todayYmd()}
              onChange={(e) => setFechaDesde(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Fecha hasta</Label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Casa</Label>
            <Select value={casaId} onValueChange={(v) => setCasaId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Elegir casa" />
              </SelectTrigger>
              <SelectContent>
                {casas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {capacidad > 0 ? (
              <p className="text-xs text-muted-foreground">
                Capacidad máxima: {capacidad} personas (adultos + niños; las mascotas no cuentan).
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Cantidad de adultos</Label>
              <Input
                type="number"
                min={1}
                max={Math.min(10, capacidad > 0 ? capacidad : 10)}
                value={adultos}
                onChange={(e) => {
                  const a = Number(e.target.value);
                  setAdultos(a);
                  if (capacidad > 0) {
                    setNinos((n) => Math.min(Math.max(0, n), Math.max(0, capacidad - a)));
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Cantidad de niños</Label>
              <Input
                type="number"
                min={0}
                max={Math.min(10, capacidad > 0 ? Math.max(0, capacidad - adultos) : 10)}
                value={ninos}
                onChange={(e) => setNinos(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:w-1/2">
            <Label>Mascotas</Label>
            <Select value={mascotas} onValueChange={(v) => setMascotas(v ?? "0")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Comprobante (.jpg, .jpeg, .pdf, máx. 5 MB)</Label>
            <Input
              type="file"
              accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
            {file?.type === "application/pdf" ? (
              <p className="text-xs text-muted-foreground">Archivo PDF seleccionado</p>
            ) : null}
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt=""
                width={320}
                height={200}
                unoptimized
                className="mt-2 max-h-40 rounded-md border object-contain"
              />
            ) : null}
            {isEdit && existingUrl && !file ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Comprobante actual guardado.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setKeepComprobante(false);
                    toast.message("Se quitará el comprobante al guardar (o subí uno nuevo).");
                  }}
                >
                  Reemplazar / quitar
                </Button>
              </div>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label>Saldo reserva (ARS)</Label>
            <Input
              value={saldoStr}
              onChange={(e) => setSaldoStr(e.target.value)}
              onBlur={onSaldoBlur}
              placeholder="0,00"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
