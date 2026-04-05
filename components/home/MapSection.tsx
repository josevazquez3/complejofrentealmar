"use client";

import Link from "next/link";
import { FadeInSection } from "@/components/home/FadeInSection";
import { useConfiguracion } from "@/hooks/useConfiguracion";

const sepiaStyle = [
  "grayscale(20%)",
  "contrast(1.05)",
  "sepia(0.25)",
  "saturate(0.85)",
].join(" ");

const FALLBACK_MAP_Q = "-37.2636,-56.9789";

/** Embed clásico de Google Maps sin API key: coordenadas (lat,lng) o texto de búsqueda / dirección. */
function mapsEmbedSrc(q: string): string {
  const params = new URLSearchParams({
    q: q.trim() || FALLBACK_MAP_Q,
    z: "15",
    output: "embed",
    hl: "es",
  });
  return `https://maps.google.com/maps?${params.toString()}`;
}

export function MapSection() {
  const config = useConfiguracion();
  const mapQ =
    config.mapa_query?.trim() || config.ubicacion_direccion?.trim() || FALLBACK_MAP_Q;
  const address =
    config.ubicacion_direccion?.trim() || "Calle 43 y Playa, Mar Azul, Buenos Aires";
  const embedSrc = mapsEmbedSrc(mapQ);
  const mapsSearchHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQ)}`;

  return (
    <section id="contacto" className="border-t border-fm-border bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="text-center">
          <h2 className="text-3xl font-bold tracking-wide text-fm-text md:text-4xl">Cómo llegar</h2>
          <div className="mx-auto mt-4 h-px w-16 bg-fm-red" />
        </FadeInSection>

        <FadeInSection className="mt-12">
          <div className="overflow-hidden rounded-lg border border-fm-border shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <iframe
              title="Mapa del complejo"
              src={embedSrc}
              className="aspect-[16/9] min-h-[280px] w-full border-0 md:min-h-[400px]"
              style={{ filter: sepiaStyle }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <p className="mt-3 text-center">
            <Link
              href={mapsSearchHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-fm-red underline-offset-4 hover:underline"
            >
              Abrir en Google Maps
            </Link>
          </p>
        </FadeInSection>
        <p className="mt-6 text-center text-sm text-fm-muted">{address}</p>
      </div>
    </section>
  );
}
