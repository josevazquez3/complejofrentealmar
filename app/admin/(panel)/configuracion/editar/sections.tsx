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

export async function CarouselSection() {
  const images = await getCarouselImages();
  return <CarouselEditor initial={images} />;
}

export async function InicioSection() {
  const row = await getInicioConfig();
  return <InicioEditor initial={row} />;
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
