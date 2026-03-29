"use client";

import Link from "next/link";
import { FadeInSection } from "@/components/home/FadeInSection";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { env } from "@/lib/env";

const sepiaStyle = [
  "grayscale(20%)",
  "contrast(1.05)",
  "sepia(0.25)",
  "saturate(0.85)",
].join(" ");

export function MapSection() {
  const config = useConfiguracion();
  const query = config.mapa_query ?? "-37.2636,-56.9789";
  const address = config.ubicacion_direccion ?? "Calle 43 y Playa, Mar Azul, Buenos Aires";
  const key = env.googleMapsKey;
  const embedSrc = key
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&zoom=13`
    : null;

  return (
    <section id="contacto" className="border-t border-fm-border bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="text-center">
          <h2 className="text-3xl font-bold tracking-wide text-fm-text md:text-4xl">Cómo llegar</h2>
          <div className="mx-auto mt-4 h-px w-16 bg-fm-red" />
        </FadeInSection>

        <FadeInSection className="mt-12">
          <div className="overflow-hidden rounded-lg border border-fm-border shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            {embedSrc ? (
              <iframe
                title="Mapa del complejo"
                src={embedSrc}
                className="aspect-[16/9] min-h-[280px] w-full border-0 md:min-h-[400px]"
                style={{ filter: sepiaStyle }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="flex aspect-[16/9] min-h-[280px] flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center md:min-h-[400px]">
                <p className="text-fm-muted">
                  Configurá <code className="rounded bg-white px-1 text-fm-text">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
                  para ver el mapa embebido.
                </p>
                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-fm-red underline-offset-4 hover:underline"
                >
                  Abrir en Google Maps
                </Link>
              </div>
            )}
          </div>
        </FadeInSection>
        <p className="mt-6 text-center text-sm text-fm-muted">{address}</p>
      </div>
    </section>
  );
}
