"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, esUrlImagenAbsoluta } from "@/lib/utils";
import { BLUR_DATA_URL } from "@/lib/blur-placeholder";

type Props = {
  images: string[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
};

export function ImageLightbox({ images, open, index, onClose, onIndexChange }: Props) {
  const safe = images.filter(Boolean);
  const n = safe.length;
  const current = n > 0 ? ((index % n) + n) % n : 0;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n <= 0) return;
      onIndexChange((current + dir + n) % n);
    },
    [current, n, onIndexChange]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (n === 0) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/80"
          role="dialog"
          aria-modal
          aria-label="Galería de imágenes"
        >
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default"
            aria-label="Cerrar"
            onClick={onClose}
          />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center p-4 pt-14">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-20 text-white hover:bg-white/10"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X className="h-7 w-7" />
            </Button>

            <div
              className="relative z-10 flex max-h-[85vh] max-w-[90vw] items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="relative h-[85vh] w-[90vw]"
                >
                  <Image
                    src={safe[current]}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="90vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    priority
                    unoptimized={esUrlImagenAbsoluta(safe[current])}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-lg border border-white/30 bg-white/25 text-white backdrop-blur-sm hover:bg-white/40"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-lg border border-white/30 bg-white/25 text-white backdrop-blur-sm hover:bg-white/40"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          <div
            className="relative z-10 flex gap-2 overflow-x-auto px-4 pb-6 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {safe.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onIndexChange(i)}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-opacity",
                  i === current ? "border-fm-red opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized={esUrlImagenAbsoluta(src)}
                />
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
