"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { FadeInSection } from "@/components/home/FadeInSection";
import { BLUR_DATA_URL } from "@/lib/blur-placeholder";
import type { Casa } from "@/types";

export function CasasGrid({
  casas,
  loadFailed,
}: {
  casas: Casa[];
  loadFailed?: boolean;
}) {
  return (
    <section id="unidades" className="border-t border-fm-border bg-fm-bg py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-wide text-fm-text md:text-4xl">Nuestras unidades</h2>
          <div className="mx-auto mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-fm-border" />
            <span className="text-fm-red">✦</span>
            <span className="h-px w-12 bg-fm-border" />
          </div>
        </FadeInSection>

        {loadFailed ? (
          <p className="text-center text-fm-muted">
            Información no disponible temporalmente. Intentá de nuevo más tarde.
          </p>
        ) : casas.length === 0 ? (
          <p className="text-center text-fm-muted">Pronto publicaremos las propiedades disponibles.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {casas.map((casa, index) => {
              const img = casa.fotos?.[0];
              return (
                <motion.article
                  key={casa.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group overflow-hidden rounded-sm border border-fm-border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
                >
                  <Link href={`/casas/${casa.id}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      {img ? (
                        <Image
                          src={img}
                          alt={casa.nombre}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-200 text-fm-muted">
                          Sin foto
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-fm-text">{casa.nombre}</h3>
                      <p className="mt-2 flex items-center gap-2 text-sm text-fm-muted">
                        <Users className="h-4 w-4 text-fm-red" />
                        Hasta {casa.capacidad_personas} personas
                      </p>
                      <span className="mt-5 inline-flex w-full items-center justify-center bg-fm-footer px-4 py-2.5 text-sm font-medium text-white transition-all group-hover:bg-fm-red">
                        Ver más
                      </span>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
