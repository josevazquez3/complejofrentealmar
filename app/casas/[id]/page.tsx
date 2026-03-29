import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CasaDetail } from "@/components/casa/CasaDetail";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { mergeConfigWithFallback } from "@/lib/config-fallback";
import { getCasaById, getConfiguracion, getOtrasCasas } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  const casa = await getCasaById(id);
  if (!casa) return { title: "Casa no encontrada" };
  const snip = casa.descripcion?.slice(0, 160).trim() ?? "";
  const desc =
    snip.length > 0
      ? snip
      : `Casa ${casa.nombre} — alquiler turístico en la Costa Atlántica.`;
  return {
    title: casa.nombre,
    description: desc,
    openGraph: {
      title: casa.nombre,
      description: desc,
    },
  };
}

export default async function CasaPage({ params }: Props) {
  const { id } = params;
  const [casa, rawConfig, otrasCasas] = await Promise.all([
    getCasaById(id),
    getConfiguracion(),
    getOtrasCasas(id),
  ]);
  if (!casa) notFound();
  const config = mergeConfigWithFallback(rawConfig);

  return (
    <PublicLayout config={config}>
      <CasaDetail casa={casa} otrasCasas={otrasCasas} />
    </PublicLayout>
  );
}
