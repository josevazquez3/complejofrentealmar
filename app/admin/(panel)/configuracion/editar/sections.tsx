import {
  getCarouselImages,
  getInicioConfig,
  getSeccionTexto,
  getUnidades,
} from "@/app/actions/configuracion";
import { CarouselEditor } from "@/components/admin/editar/CarouselEditor";
import { InicioEditor } from "@/components/admin/editar/InicioEditor";
import { SeccionTextoEditor } from "@/components/admin/editar/SeccionTextoEditor";
import { UnidadesEditor } from "@/components/admin/editar/UnidadesEditor";
import { VideoEditor } from "@/components/admin/editar/VideoEditor";
import { mergeConfigWithFallback } from "@/lib/config-fallback";
import { getConfiguracion } from "@/lib/queries";

export async function CarouselSection() {
  const images = await getCarouselImages();
  return <CarouselEditor initial={images} />;
}

export async function InicioSection() {
  const row = await getInicioConfig();
  return <InicioEditor initial={row} />;
}

export async function VideoSectionAdmin() {
  const row = await getConfiguracion();
  const merged = mergeConfigWithFallback(row);
  return <VideoEditor initialYoutubeId={merged.youtube_video_id} />;
}

export async function UnidadesSection() {
  const list = await getUnidades();
  return <UnidadesEditor initial={list} />;
}

export async function EquipamientoEditSection() {
  const row = await getSeccionTexto("equipamiento");
  return <SeccionTextoEditor id="equipamiento" initial={row} />;
}

export async function ServiciosEditSection() {
  const row = await getSeccionTexto("servicios");
  return <SeccionTextoEditor id="servicios" initial={row} />;
}
