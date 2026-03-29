"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type CasaOpt = { id: string; nombre: string };

export function InventarioModal({
  open,
  casas,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  casas: CasaOpt[];
  onOpenChange: (v: boolean) => void;
  onConfirm: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  function toggle(id: string, checked: boolean) {
    setSelected((s) => ({ ...s, [id]: checked }));
  }

  function handleAbrir() {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (ids.length === 0) {
      toast.error("Seleccioná al menos una casa");
      return;
    }
    onConfirm(ids);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seleccionar casas</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Elegí una o más propiedades para ver su inventario agrupado.
        </p>
        <div className="grid max-h-[50vh] gap-3 overflow-y-auto py-2">
          {casas.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                id={c.id}
                checked={!!selected[c.id]}
                onCheckedChange={(v) => toggle(c.id, v === true)}
              />
              <Label htmlFor={c.id} className="flex-1 cursor-pointer font-normal">
                {c.nombre}
              </Label>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleAbrir}>
            Abrir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
