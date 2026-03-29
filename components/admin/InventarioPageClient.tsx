"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { InventarioConCasa } from "@/types";
import { InventarioModal } from "./InventarioModal";
import { InventarioTable } from "./InventarioTable";
import { toast } from "sonner";

type CasaOpt = { id: string; nombre: string };

export function InventarioPageClient({ casas }: { casas: CasaOpt[] }) {
  const [modalOpen, setModalOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [rows, setRows] = useState<InventarioConCasa[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (ids: string[]) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("inventario")
        .select("*, casas(nombre)")
        .in("casa_id", ids)
        .order("casa_id");
      if (error) {
        toast.error(error.message);
        setRows([]);
        return;
      }
      setRows((data ?? []) as InventarioConCasa[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedIds && selectedIds.length > 0) {
      void load(selectedIds);
    }
  }, [selectedIds, load]);

  function onConfirm(ids: string[]) {
    setSelectedIds(ids);
  }

  function reopenModal() {
    setModalOpen(true);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-nautico-900">Inventario</h1>
          <p className="text-sm text-nautico-700/80">Agrupado por casa</p>
        </div>
        <Button variant="outline" onClick={reopenModal}>
          Cambiar casas
        </Button>
      </div>

      <InventarioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        casas={casas}
        onConfirm={onConfirm}
      />

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando inventario…</p>
        ) : selectedIds ? (
          <InventarioTable rows={rows} />
        ) : (
          <p className="text-sm text-muted-foreground">Seleccioná casas en el modal para comenzar.</p>
        )}
      </div>
    </div>
  );
}
