import { Suspense } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ReservasClient } from "@/components/reservas/ReservasClient";
import { mergeConfigWithFallback } from "@/lib/config-fallback";
import { getCasasParaReservas, getConfiguracion } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ReservasPage() {
  const [rawConfig, casasResult] = await Promise.all([getConfiguracion(), getCasasParaReservas()]);
  const config = mergeConfigWithFallback(rawConfig);
  const { casas, failed: casasLoadFailed, noDatabase } = casasResult;

  return (
    <PublicLayout config={config}>
      <Suspense
        fallback={
          <div className="mx-auto max-w-5xl px-4 py-20 text-center text-fm-muted">Cargando…</div>
        }
      >
        <ReservasClient
          casas={casas}
          casasLoadFailed={casasLoadFailed}
          noDatabase={noDatabase}
          whatsappE164={config.whatsapp_e164}
          emailContacto={config.email_contacto}
        />
      </Suspense>
    </PublicLayout>
  );
}
