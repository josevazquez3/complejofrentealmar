"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EditarTabsShell({
  carousel,
  inicio,
  video,
  unidades,
  equipamiento,
  servicios,
}: {
  carousel: ReactNode;
  inicio: ReactNode;
  video: ReactNode;
  unidades: ReactNode;
  equipamiento: ReactNode;
  servicios: ReactNode;
}) {
  return (
    <Tabs defaultValue="carousel" className="mt-6 w-full overflow-hidden">
      <TabsList
        variant="line"
        className="mb-4 flex h-auto min-h-8 w-full flex-wrap justify-start gap-1"
      >
        <TabsTrigger value="carousel">Carrusel</TabsTrigger>
        <TabsTrigger value="inicio">Inicio</TabsTrigger>
        <TabsTrigger value="video">Video</TabsTrigger>
        <TabsTrigger value="unidades">Unidades</TabsTrigger>
        <TabsTrigger value="equipamiento">Equipamiento</TabsTrigger>
        <TabsTrigger value="servicios">Servicios</TabsTrigger>
      </TabsList>
      <TabsContent value="carousel" className="w-full min-h-[200px] overflow-hidden">
        {carousel}
      </TabsContent>
      <TabsContent value="inicio" className="w-full min-h-[200px] overflow-hidden">
        {inicio}
      </TabsContent>
      <TabsContent value="video" className="w-full min-h-[200px] overflow-hidden">
        {video}
      </TabsContent>
      <TabsContent value="unidades" className="w-full min-h-[200px]">
        {unidades}
      </TabsContent>
      <TabsContent value="equipamiento" className="w-full min-h-[200px] overflow-hidden">
        {equipamiento}
      </TabsContent>
      <TabsContent value="servicios" className="w-full min-h-[200px] overflow-hidden">
        {servicios}
      </TabsContent>
    </Tabs>
  );
}
