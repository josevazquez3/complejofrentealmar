import { getCategoriasInventarioConConteo } from "@/lib/queries";
import { CategoriasInventarioClient } from "@/components/admin/inventario/CategoriasInventarioClient";

export const dynamic = "force-dynamic";

export default async function AdminInventarioCategoriasPage() {
  const rows = await getCategoriasInventarioConConteo();
  return <CategoriasInventarioClient initialRows={rows} />;
}
