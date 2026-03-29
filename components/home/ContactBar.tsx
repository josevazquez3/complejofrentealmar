"use client";

import Link from "next/link";
import { FadeInSection } from "@/components/home/FadeInSection";
import { useConfiguracion } from "@/hooks/useConfiguracion";

function formatPhoneDisplay(e164: string | null | undefined) {
  const d = (e164 ?? "").replace(/\D/g, "");
  if (d.length >= 10) {
    const rest = d.slice(-10);
    return `+${d.slice(0, d.length - 10)}.${rest.slice(0, 4)}.${rest.slice(4)}`;
  }
  return "+549.2233.024541";
}

export function ContactBar() {
  const config = useConfiguracion();
  const phoneLabel = formatPhoneDisplay(config.whatsapp_e164);
  const email = config.email_contacto?.trim() || "complejofrentealmar@gmail.com";
  const wa = `https://wa.me/${(config.whatsapp_e164 ?? "5492233024541").replace(/\D/g, "")}`;

  return (
    <FadeInSection className="w-full">
      <div className="flex flex-col gap-6 bg-gray-100 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-12">
        <div className="max-w-2xl">
          <p className="text-lg font-bold text-fm-red">
            <Link href={wa} className="transition hover:underline" target="_blank" rel="noopener noreferrer">
              {phoneLabel} WhatsApp
            </Link>
            <span className="text-fm-muted">{" // "}</span>
            <a href={`mailto:${email}`} className="transition hover:underline">
              {email}
            </a>
          </p>
          <p className="mt-2 text-sm text-fm-muted">
            Estos son nuestros medios de comunicación, envíenos su consulta y a la brevedad nos
            comunicaremos!
          </p>
        </div>
        <Link
          href={`mailto:${email}?subject=Consulta%20Complejo%20Frente%20al%20Mar`}
          className="inline-flex shrink-0 items-center justify-center bg-fm-footer px-8 py-4 text-center text-sm font-medium uppercase tracking-widest text-white transition-colors duration-300 hover:bg-fm-red"
        >
          ENVIAR CONSULTA AQUÍ
        </Link>
      </div>
    </FadeInSection>
  );
}
