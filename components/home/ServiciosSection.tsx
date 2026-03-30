"use client";

import { FadeInSection } from "@/components/home/FadeInSection";

export function ServiciosSection({
  titulo = "SERVICIOS",
  descripcion = "Servicios de mucama, desayuno en temporada alta, seguridad nocturna, reposeras y atención personalizada para que su estadía sea tranquila durante las cuatro estaciones. Consulte disponibilidad y condiciones según época del año.",
}: {
  titulo?: string;
  descripcion?: string;
}) {
  return (
    <section id="servicios" className="border-t border-fm-border bg-gray-50 px-8 py-16 md:px-16">
      <FadeInSection className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-widest text-fm-text">{titulo}</h2>
        <div className="mx-auto mt-4 h-px w-16 bg-fm-red" />
        <p className="mt-8 whitespace-pre-line leading-relaxed text-fm-muted">{descripcion}</p>
      </FadeInSection>
    </section>
  );
}
