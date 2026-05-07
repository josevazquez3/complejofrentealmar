import { CasasGrid } from "@/components/home/CasasGrid";
import { EquipamientoSection } from "@/components/home/EquipamientoSection";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { IntroSection } from "@/components/home/IntroSection";
import { MarketingUnidadesGrid } from "@/components/home/MarketingUnidadesGrid";
import { MapSection } from "@/components/home/MapSection";
import { ServiciosSection } from "@/components/home/ServiciosSection";
import { PromoGifSection } from "@/components/home/PromoGifSection";
import { VideoSection } from "@/components/home/VideoSection";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { mergeConfigWithFallback } from "@/lib/config-fallback";
import { env } from "@/lib/env";
import {
  type CasasLoadResult,
  getCasasActivasForHome,
  getConfiguracion,
  getHeroImageUrls,
  getInicioMarketing,
  getSeccionTextoPublic,
  getUnidadesMarketing,
  SECCION_PUBLIC_FALLBACK,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const HOME_FETCH_MS = 18_000;

/** Evita que la consulta a la BD deje GET / colgado; devuelve fallback al timeout. */
async function homeDataTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(fallback), HOME_FETCH_MS);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch(() => {
        clearTimeout(t);
        resolve(fallback);
      });
  });
}

export default async function HomePage() {
  const casasFallback: CasasLoadResult = { casas: [], failed: true, noDatabase: false };
  const [rawConfig, casasResult, heroUrls, inicio, marketingUnidades, secEquip, secServ] =
    await Promise.all([
      homeDataTimeout(getConfiguracion(), null),
      homeDataTimeout(getCasasActivasForHome(), casasFallback),
      homeDataTimeout(getHeroImageUrls(), []),
      homeDataTimeout(getInicioMarketing(), null),
      homeDataTimeout(getUnidadesMarketing(), []),
      homeDataTimeout(getSeccionTextoPublic("equipamiento"), SECCION_PUBLIC_FALLBACK.equipamiento),
      homeDataTimeout(getSeccionTextoPublic("servicios"), SECCION_PUBLIC_FALLBACK.servicios),
    ]);

  const { casas, failed: casasFailed } = casasResult;

  const config = mergeConfigWithFallback(rawConfig);

  return (
    <PublicLayout config={config}>
      <HeroCarousel imageUrls={heroUrls} />
      <IntroSection
        titulo={inicio?.titulo}
        descripcion={inicio?.descripcion}
        fotos={inicio?.fotos}
      />
      {env.promoGifUrl ? <PromoGifSection src={env.promoGifUrl} /> : null}
      {marketingUnidades.length > 0 ? (
        <MarketingUnidadesGrid unidades={marketingUnidades} />
      ) : (
        <CasasGrid casas={casas} loadFailed={casasFailed} />
      )}
      <EquipamientoSection titulo={secEquip.titulo} descripcion={secEquip.descripcion} />
      <ServiciosSection titulo={secServ.titulo} descripcion={secServ.descripcion} />
      <VideoSection youtubeVideoId={config.youtube_video_id} />
      <MapSection />
    </PublicLayout>
  );
}
