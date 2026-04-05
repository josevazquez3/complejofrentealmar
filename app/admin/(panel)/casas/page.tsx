import { CasasAdminView } from "@/components/admin/casas/CasasAdminView";
import { getAllCasasAdmin } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminCasasPage() {
  const casas = await getAllCasasAdmin();

  return (
    <CasasAdminView initialCasas={casas}>
      <div>
        <h1 className="font-display text-3xl font-semibold text-nautico-900">Casas (unidades de alquiler)</h1>
        <p className="mt-2 max-w-2xl text-sm text-nautico-700/85">
          Solo las casas <strong className="text-nautico-900">activas</strong> aparecen en el sitio público (listado
          CasasGrid si no hay unidades de marketing), en <code className="rounded bg-nautico-900/10 px-1">/reservas</code>{" "}
          y en la ficha pública. Las unidades del bloque &quot;marketing&quot; en el inicio son otro modelo (tabla{" "}
          <code className="rounded bg-nautico-900/10 px-1">unidad</code>) y no reemplazan a las casas para reservar.
        </p>
      </div>
    </CasasAdminView>
  );
}
