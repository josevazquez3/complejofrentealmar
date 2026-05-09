"use client";

import { FaWhatsapp } from "react-icons/fa";
import { useConfiguracion } from "@/hooks/useConfiguracion";

export function WhatsAppButton() {
  const config = useConfiguracion();

  const digits = (config.whatsapp_e164 ?? "").replace(/\D/g, "");

  const mensaje =
    config.whatsapp_mensaje_publico?.trim() ||
    "Hola! Me comunico desde el sitio web. Quisiera hacer una consulta.";

  const href = `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`;

  if (!digits) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-110"
    >
      <FaWhatsapp className="h-8 w-8" />
    </a>
  );
}