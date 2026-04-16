"use client";

import Image from "next/image";
import Link from "next/link";
import { FadeInSection } from "@/components/home/FadeInSection";
import { BLUR_DATA_URL } from "@/lib/blur-placeholder";
import { evitarOptimizadorNextImage } from "@/lib/utils";

/** Archivos bajo /public/images no existen en el repo; Unsplash ya está permitido en next.config. */
const FALLBACK_FOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80",
];

const FALLBACK_TITULO = "INICIO - COMPLEJO FRENTE AL MAR AZUL.";

export function IntroSection({
  titulo,
  descripcion,
  fotos,
}: {
  titulo?: string | null;
  descripcion?: string | null;
  fotos?: string[] | null;
}) {
  const imgs =
    fotos && fotos.filter(Boolean).length > 0 ? fotos.filter(Boolean) : FALLBACK_FOTOS;
  const head = (titulo?.trim() || FALLBACK_TITULO).trim();
  const useCustomText = Boolean(descripcion?.trim());

  return (
    <section className="grid grid-cols-1 items-center gap-8 px-8 py-16 md:grid-cols-2 md:px-16">
      <FadeInSection>
        <div className="grid grid-cols-2 gap-3">
          {imgs.slice(0, 4).map((src, i) => (
            <div key={`${src}-${i}`} className="relative h-48 overflow-hidden rounded-sm">
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 40vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                priority={i < 2}
                unoptimized={evitarOptimizadorNextImage(src)}
              />
            </div>
          ))}
        </div>
      </FadeInSection>

      <FadeInSection>
        <h2 className="text-2xl font-bold tracking-wide text-gray-800">{head}</h2>
        <div className="mb-6 mt-2 w-8 border-t-2 border-black" />
        {useCustomText ? (
          <p className="mb-8 whitespace-pre-line leading-relaxed text-fm-muted">{descripcion}</p>
        ) : (
          <>
            <p className="mb-4 leading-relaxed text-fm-muted">
              Contamos con excelentes unidades con vista al mar particularmente decorado y equipado para su
              comodidad!
            </p>
            <p className="mb-4 leading-relaxed text-fm-muted">
              Con todo el confort y la atención personalizada que asegura la tranquilidad y relax que usted
              busca. Nuestros servicios hacen que nuestro complejo sea un lugar para ser visitado durante las
              cuatro estaciones del año.
            </p>
            <p className="mb-8 leading-relaxed text-fm-muted">
              Con una inmejorable ubicación frente al mar, de una de las playas más bellas de la costa
              argentina.
            </p>
          </>
        )}
        <Link
          href="/#unidades"
          className="inline-block border border-gray-800 px-8 py-3 text-sm font-medium uppercase tracking-widest text-gray-800 transition-colors duration-300 hover:bg-gray-800 hover:text-white"
        >
          VER UNIDADES
        </Link>
      </FadeInSection>
    </section>
  );
}
