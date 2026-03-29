"use client";

import { motion } from "framer-motion";
import { useConfiguracion } from "@/hooks/useConfiguracion";

export function InfoSection() {
  const config = useConfiguracion();
  const name = config.complejo_nombre;
  const body =
    config.descripcion_home?.trim() ||
    "Ubicado en un entorno privilegiado de la Costa Atlántica, nuestro complejo combina diseño contemporáneo, amplitud y la calma del mar.";

  return (
    <section className="relative py-20 md:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(201,169,110,0.25) 0%, transparent 45%),
            radial-gradient(circle at 80% 70%, rgba(26,58,92,0.2) 0%, transparent 50%),
            linear-gradient(180deg, #fdf8f0 0%, #f8f9fa 100%)`,
        }}
      />
      <div className="relative mx-auto max-w-[800px] px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="font-display text-3xl font-semibold text-nautico-900 md:text-4xl">
            Bienvenidos a {name}
          </h2>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-arena-500 to-transparent" />
          <p className="mt-8 text-base leading-relaxed text-nautico-800/90 md:text-lg">{body}</p>
        </motion.div>
      </div>
    </section>
  );
}
