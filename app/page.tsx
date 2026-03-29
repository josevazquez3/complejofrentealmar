import { CasasGrid } from "@/components/home/CasasGrid";
import { ContactBar } from "@/components/home/ContactBar";
import { EquipamientoSection } from "@/components/home/EquipamientoSection";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { IntroSection } from "@/components/home/IntroSection";
import { MapSection } from "@/components/home/MapSection";
import { ServiciosSection } from "@/components/home/ServiciosSection";
import { VideoSection } from "@/components/home/VideoSection";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { mergeConfigWithFallback } from "@/lib/config-fallback";
import {
  getCasasActivasForHome,
  getConfiguracion,
  getHeroImageUrls,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [rawConfig, { casas, failed: casasFailed }, heroUrls] = await Promise.all([
    getConfiguracion(),
    getCasasActivasForHome(),
    getHeroImageUrls(),
  ]);

  const config = mergeConfigWithFallback(rawConfig);

  return (
    <PublicLayout config={config}>
      <HeroCarousel imageUrls={heroUrls} />
      <ContactBar />
      <IntroSection />
      <CasasGrid casas={casas} loadFailed={casasFailed} />
      <EquipamientoSection />
      <ServiciosSection />
      <VideoSection />
      <MapSection />
    </PublicLayout>
  );
}
