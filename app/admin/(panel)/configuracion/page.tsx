import { ConfiguracionForm } from "@/components/admin/config/ConfiguracionForm";
import { mergeConfigWithFallback } from "@/lib/config-fallback";
import { getConfiguracion } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  const row = await getConfiguracion();
  const initial = mergeConfigWithFallback(row);

  return <ConfiguracionForm initial={initial} sinFilaEnBd={!row} />;
}
