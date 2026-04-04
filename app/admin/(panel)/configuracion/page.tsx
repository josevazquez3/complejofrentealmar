import { ConfiguracionForm } from "@/components/admin/config/ConfiguracionForm";
import { mergeConfigWithFallback } from "@/lib/config-fallback";
import { getConfiguracion } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  const row = await getConfiguracion();
  if (!row) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-nautico-900">
        <p className="font-medium">No hay fila de configuración en la base de datos.</p>
        <p className="mt-2 text-sm text-nautico-800/90">
          Creá el registro inicial con <code className="rounded bg-white px-1">npx prisma db push</code> o tu script
          de seed, o insertá una fila en la tabla <code className="rounded bg-white px-1">configuracion</code> en Neon.
        </p>
      </div>
    );
  }

  return <ConfiguracionForm initial={mergeConfigWithFallback(row)} />;
}
