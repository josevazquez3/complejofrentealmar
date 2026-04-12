"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, esUrlImagenAbsoluta } from "@/lib/utils";
import { BLUR_DATA_URL } from "@/lib/blur-placeholder";

/** Fallback cuando no hay fotos en BD: URLs remotas válidas (evita .jpg locales rotos o HTML disfrazado de imagen). */
const LOCAL_HERO = [
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
];

const AUTO_MS = 5500;

export function HeroCarousel({ imageUrls }: { imageUrls: string[] }) {
  const slides = imageUrls.length > 0 ? imageUrls : LOCAL_HERO;
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <section id="inicio" className="relative h-[70vh] min-h-[280px] w-full overflow-hidden bg-black">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={slides[index]}
            alt=""
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            unoptimized={esUrlImagenAbsoluta(slides[index])}
          />
        </motion.div>
      </AnimatePresence>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 z-10 h-11 w-11 -translate-y-1/2 rounded-lg border border-white/30 bg-white/25 text-white backdrop-blur-sm transition hover:bg-white/40"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 z-10 h-11 w-11 -translate-y-1/2 rounded-lg border border-white/30 bg-white/25 text-white backdrop-blur-sm transition hover:bg-white/40"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir al slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === index ? "w-8 bg-white" : "w-2 bg-white/45 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </section>
  );
}
