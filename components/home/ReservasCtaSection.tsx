"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConfiguracion } from "@/hooks/useConfiguracion";

export function ReservasCtaSection() {
  const config = useConfiguracion();
  const wa = config.whatsapp_e164 ?? "";
  const clean = wa.replace(/\D/g, "");

  return (
    <section id="reservas" className="py-20 md:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-arena-400/30 bg-gradient-to-br from-nautico-900 to-nautico-800 px-8 py-14 text-blanco shadow-xl"
        >
          <h2 className="font-display text-2xl md:text-3xl">Reservas</h2>
          <p className="mt-4 text-sm leading-relaxed text-blanco/80 md:text-base">
            Escribinos por WhatsApp con las fechas deseadas y la cantidad de huéspedes. Te
            respondemos a la brevedad con disponibilidad y condiciones.
          </p>
          <Link
            href={`https://wa.me/${clean}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "mt-8 inline-flex rounded-full bg-arena-500 px-8 text-nautico-900 hover:bg-arena-400"
            )}
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Consultar por WhatsApp
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
