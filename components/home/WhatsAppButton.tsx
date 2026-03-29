"use client";

import { FaWhatsapp } from "react-icons/fa";
import { useConfiguracion } from "@/hooks/useConfiguracion";

export function WhatsAppButton() {
  const config = useConfiguracion();
  const digits = (config.whatsapp_e164 ?? "5492233024541").replace(/\D/g, "");
  const href = `https://wa.me/${digits}`;

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
