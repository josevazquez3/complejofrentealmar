import { Suspense } from "react";
import { PenLine } from "lucide-react";
import { EditarTabsShell } from "@/components/admin/editar/EditarTabsShell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CarouselSection,
  EquipamientoEditSection,
  InicioSection,
  ServiciosEditSection,
  UnidadesSection,
  VideoSectionAdmin,
} from "./sections";

function TabSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-nautico-900/10 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function AdminConfiguracionEditarPage() {
  return (
    <div className="overflow-hidden">
      <div className="mb-2 flex items-center gap-3">
        <PenLine className="h-8 w-8 text-arena-600" aria-hidden />
        <div>
          <h1 className="font-display text-3xl font-semibold text-nautico-900">Editar sitio</h1>
          <p className="mt-1 text-sm text-nautico-700/80">
            Carrusel, bloque Inicio y unidades de marketing (contenido público).
          </p>
        </div>
      </div>

      <EditarTabsShell
        carousel={
          <Suspense fallback={<TabSkeleton />}>
            <CarouselSection />
          </Suspense>
        }
        inicio={
          <Suspense fallback={<TabSkeleton />}>
            <InicioSection />
          </Suspense>
        }
        video={
          <Suspense fallback={<TabSkeleton />}>
            <VideoSectionAdmin />
          </Suspense>
        }
        unidades={
          <Suspense fallback={<TabSkeleton />}>
            <UnidadesSection />
          </Suspense>
        }
        equipamiento={
          <Suspense fallback={<TabSkeleton />}>
            <EquipamientoEditSection />
          </Suspense>
        }
        servicios={
          <Suspense fallback={<TabSkeleton />}>
            <ServiciosEditSection />
          </Suspense>
        }
      />
    </div>
  );
}
