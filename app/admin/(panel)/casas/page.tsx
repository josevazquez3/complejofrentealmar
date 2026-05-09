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
          Solo las casas <strong className="text-nautico-900">activas</strong> se muestran
          en el sitio web y pueden recibir reservas. Las imágenes del inicio son decorativas
          y se administran por separado desde la sección <strong className="text-nautico-900">Unidades</strong>.
        </p>
      </div>
    </CasasAdminView>
  );
}
