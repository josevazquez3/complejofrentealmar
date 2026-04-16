"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BLUR_DATA_URL } from "@/lib/blur-placeholder";
import { evitarOptimizadorNextImage } from "@/lib/utils";
import type { CasaListItem } from "@/types";

function snippet(text: string | null | undefined, max = 120) {
  const t = text?.trim() ?? "";
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function OtrasUnidades({ casas }: { casas: CasaListItem[] }) {
  if (casas.length === 0) return null;

  return (
    <section className="w-full bg-gray-50 py-12">
      <h2 className="mb-8 text-center text-xl font-bold tracking-widest text-fm-text">
        OTRAS UNIDADES DISPONIBLES
      </h2>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-8 sm:grid-cols-2 lg:grid-cols-3">
        {casas.map((casa, i) => {
          const img = casa.fotos?.[0];
          const desc = snippet(casa.descripcion);
          return (
            <motion.article
              key={casa.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="overflow-hidden rounded-t-lg border border-fm-border bg-white shadow-sm"
            >
              <div className="relative h-48 w-full bg-gray-100">
                {img ? (
                  <Image
                    src={img}
                    alt={casa.nombre}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    unoptimized={evitarOptimizadorNextImage(img)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-fm-muted">Sin foto</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{casa.nombre}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-fm-muted">{desc || "Consultá disponibilidad."}</p>
                <Link
                  href={`/casas/${casa.id}`}
                  className="mt-4 inline-block border border-gray-800 px-4 py-2 text-sm font-medium uppercase tracking-wide text-gray-800 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  VER UNIDAD
                </Link>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
