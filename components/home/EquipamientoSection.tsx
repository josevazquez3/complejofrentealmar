"use client";

import { FadeInSection } from "@/components/home/FadeInSection";

export function EquipamientoSection({
  titulo = "EQUIPAMIENTO",
  descripcion = "Nuestras unidades cuentan con decoración cuidada, cocina equipada, climatización en dormitorios principales, TV, ropa de cama, parrilla individual en terrazas o balcones y espacios pensados para el descanso frente al mar.",
}: {
  titulo?: string;
  descripcion?: string;
}) {
  return (
    <section id="equipamiento" className="border-t border-fm-border bg-white px-8 py-16 md:px-16">
      <FadeInSection className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-widest text-fm-text">{titulo}</h2>
        <div className="mx-auto mt-4 h-px w-16 bg-fm-red" />
        <p className="mt-8 whitespace-pre-line leading-relaxed text-fm-muted">{descripcion}</p>
      </FadeInSection>
    </section>
  );
}
