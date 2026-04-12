"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, MessageCircle, Phone } from "lucide-react";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { CasaCaracteristicas } from "@/components/home/CasaCaracteristicas";
import { ContactBar } from "@/components/home/ContactBar";
import { FadeInSection } from "@/components/home/FadeInSection";
import { ImageLightbox } from "@/components/home/ImageLightbox";
import { OtrasUnidades } from "@/components/home/OtrasUnidades";
import { buttonVariants } from "@/components/ui/button";
import { cn, esUrlImagenAbsoluta } from "@/lib/utils";
import { BLUR_DATA_URL } from "@/lib/blur-placeholder";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import type { Casa, CasaListItem } from "@/types";

function formatPrecio(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export function CasaDetail({
  casa,
  otrasCasas,
}: {
  casa: Casa;
  otrasCasas: CasaListItem[];
}) {
  const config = useConfiguracion();
  const waDigits = (config.whatsapp_e164 ?? "5492233024541").replace(/\D/g, "");
  const email = config.email_contacto?.trim() ?? "";
  const phoneDisplay = config.whatsapp_e164
    ? `+${config.whatsapp_e164.replace(/\D/g, "")}`
    : "+54 9 2233 024541";

  const fotos = useMemo(() => casa.fotos?.filter(Boolean) ?? [], [casa.fotos]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareUrl(typeof window !== "undefined" ? window.location.href : "");
  }, []);

  const waMessage = `Hola, me interesa la unidad ${casa.nombre}`;
  const waHref = `https://wa.me/${waDigits}?text=${encodeURIComponent(waMessage)}`;
  const reservasHref = `/reservas?casaId=${encodeURIComponent(casa.id)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  const subtitulo = casa.descripcion_corta?.trim() || null;

  return (
    <div className="bg-fm-bg pb-0">
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-gray-100 px-4 py-3 sm:px-8"
        aria-label="Migas de pan"
      >
        <div className="mx-auto flex max-w-6xl min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link href="/" className="shrink-0 text-fm-red transition-colors hover:underline">
            Inicio
          </Link>
          <span className="text-fm-muted">/</span>
          <Link href="/#unidades" className="shrink-0 text-fm-red transition-colors hover:underline">
            Unidades
          </Link>
          <span className="text-fm-muted">/</span>
          <span className="min-w-0 truncate font-medium text-fm-text">{casa.nombre}</span>
        </div>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="w-full px-4 pt-6 sm:px-8"
      >
        {fotos.length === 0 ? (
          <div className="mx-auto flex h-96 max-w-6xl items-center justify-center rounded-lg border border-fm-border bg-gray-100 text-fm-muted">
            Sin fotos cargadas
          </div>
        ) : fotos.length === 1 ? (
          <button
            type="button"
            className="relative mx-auto block h-96 w-full max-w-6xl overflow-hidden rounded-lg"
            onClick={() => openLightbox(0)}
          >
            <Image
              src={fotos[0]}
              alt={casa.nombre}
              fill
              className="object-cover"
              sizes="(max-width: 1152px) 100vw, 1152px"
              priority
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              unoptimized={esUrlImagenAbsoluta(fotos[0])}
            />
          </button>
        ) : (
          <>
            {/* Mobile: imagen principal a ancho completo + miniaturas en fila */}
            <div className="mx-auto max-w-6xl md:hidden">
              <button
                type="button"
                className="relative h-96 w-full overflow-hidden rounded-lg"
                onClick={() => openLightbox(0)}
              >
                <Image
                  src={fotos[0]}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  unoptimized={esUrlImagenAbsoluta(fotos[0])}
                />
              </button>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {fotos.slice(1).map((src, i) => {
                  const idx = i + 1;
                  const showOverlay = idx === 2 && fotos.length > 3;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md"
                      onClick={() => openLightbox(idx)}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="128px"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        unoptimized={esUrlImagenAbsoluta(src)}
                      />
                      {showOverlay ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white">
                          +{fotos.length - 3} fotos
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop: grid principal + columna de miniaturas */}
            {fotos.length === 2 ? (
              <div className="mx-auto hidden max-w-6xl grid-cols-3 gap-2 md:grid">
                <button
                  type="button"
                  className="relative col-span-2 h-96 overflow-hidden rounded-l-lg"
                  onClick={() => openLightbox(0)}
                >
                  <Image
                    src={fotos[0]}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="66vw"
                    priority
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    unoptimized={esUrlImagenAbsoluta(fotos[0])}
                  />
                </button>
                <button
                  type="button"
                  className="relative h-96 overflow-hidden rounded-r-lg"
                  onClick={() => openLightbox(1)}
                >
                  <Image
                    src={fotos[1]}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="33vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    unoptimized={esUrlImagenAbsoluta(fotos[1])}
                  />
                </button>
              </div>
            ) : (
              <div className="mx-auto hidden max-w-6xl grid-cols-3 gap-2 md:grid">
                <button
                  type="button"
                  className="relative col-span-2 h-96 overflow-hidden rounded-l-lg"
                  onClick={() => openLightbox(0)}
                >
                  <Image
                    src={fotos[0]}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="66vw"
                    priority
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    unoptimized={esUrlImagenAbsoluta(fotos[0])}
                  />
                </button>
                <div className="grid h-96 grid-rows-2 gap-2">
                  <button
                    type="button"
                    className="relative h-[186px] overflow-hidden rounded-tr-lg"
                    onClick={() => openLightbox(1)}
                  >
                    <Image
                      src={fotos[1]}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="33vw"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      unoptimized={esUrlImagenAbsoluta(fotos[1])}
                    />
                  </button>
                  <button
                    type="button"
                    className="relative h-[186px] overflow-hidden rounded-br-lg"
                    onClick={() => openLightbox(2)}
                  >
                    <Image
                      src={fotos[2]}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="33vw"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      unoptimized={esUrlImagenAbsoluta(fotos[2])}
                    />
                    {fotos.length > 3 ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
                        +{fotos.length - 3} fotos
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-8 py-10 lg:grid-cols-3">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-2xl font-bold tracking-wide text-gray-800">{casa.nombre}</h1>
          {subtitulo ? <p className="mt-1 text-base text-fm-muted">{subtitulo}</p> : null}
          <div className="mb-6 mt-3 h-0.5 w-12 bg-fm-red" />

          <div className="text-gray-600">
            <p className="whitespace-pre-line leading-relaxed">
              {casa.descripcion?.trim() ||
                "Consultá disponibilidad y detalles de la estadía con nuestro equipo."}
            </p>
          </div>

          <CasaCaracteristicas casa={casa} />

          {casa.equipamiento && casa.equipamiento.length > 0 ? (
            <FadeInSection className="mt-10">
              <h2 className="text-lg font-bold text-gray-800">Equipamiento de la unidad</h2>
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {casa.equipamiento.map((item) => (
                  <li key={item} className="flex gap-2 text-fm-muted">
                    <span className="text-fm-red" aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </FadeInSection>
          ) : null}
        </motion.div>

        <motion.aside
          className="h-fit lg:sticky lg:top-24 lg:self-start"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="rounded-xl border border-fm-border bg-white p-6 shadow-md">
            {casa.precio_noche != null && casa.precio_noche > 0 ? (
              <p className="text-2xl font-bold text-fm-red">
                Desde {formatPrecio(casa.precio_noche)} / noche
              </p>
            ) : (
              <p className="text-2xl font-bold text-fm-red">Consultar precio</p>
            )}

            <Link
              href={reservasHref}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "mt-6 w-full bg-fm-red py-4 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-red-700"
              )}
            >
              CONSULTAR DISPONIBILIDAD
            </Link>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 bg-[#25D366] py-3 text-sm font-medium text-white transition-opacity hover:opacity-95"
            >
              <FaWhatsapp className="h-5 w-5" />
              Consultar por WhatsApp
            </a>

            <div className="my-6 border-t border-fm-border" />

            <p className="font-medium text-fm-red">
              <Phone className="mr-2 inline h-4 w-4" aria-hidden />
              <a href={`tel:${waDigits}`}>{phoneDisplay}</a>
            </p>
            {email ? (
              <p className="mt-2 text-sm text-fm-muted">
                <a href={`mailto:${email}`}>{email}</a>
              </p>
            ) : null}

            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-fm-muted">Compartir</p>
            <div className="mt-2 flex gap-4">
              <button
                type="button"
                onClick={copyLink}
                className="text-fm-muted transition-colors hover:text-fm-red"
                aria-label="Copiar enlace"
              >
                <Copy className="h-5 w-5" />
              </button>
              <span className="sr-only" aria-live="polite">
                {copied ? "Enlace copiado" : ""}
              </span>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${waMessage} ${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fm-muted transition-colors hover:text-fm-red"
                aria-label="Compartir en WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fm-muted transition-colors hover:text-fm-red"
                aria-label="Compartir en Facebook"
              >
                <FaFacebookF className="h-5 w-5" />
              </a>
            </div>
          </div>
        </motion.aside>
      </div>

      <OtrasUnidades casas={otrasCasas} />

      <ContactBar />

      <ImageLightbox
        images={fotos}
        open={lightboxOpen}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
}
