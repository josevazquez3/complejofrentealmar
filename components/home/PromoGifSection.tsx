import { FadeInSection } from "@/components/home/FadeInSection";

/**
 * GIF animado promocional (archivo en `public/` o URL absoluta).
 * Los GIF animados se sirven con `<img>` para conservar la animación sin depender de `remotePatterns`.
 */
export function PromoGifSection({ src }: { src: string }) {
  return (
    <section className="bg-[#faf8f6] py-14">
      <FadeInSection className="mx-auto max-w-4xl px-4 text-center">
        <p className="mb-2 text-base italic text-fm-red">Tu lugar frente al mar</p>
        <h2 className="mb-6 text-2xl font-bold tracking-widest text-fm-text">PROMO</h2>
        <div className="mx-auto overflow-hidden rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- GIF animado; rutas locales y externas sin configurar dominios */}
          <img
            src={src}
            alt="Promoción Complejo Frente al Mar"
            className="mx-auto h-auto w-full max-w-3xl"
            loading="lazy"
            decoding="async"
          />
        </div>
      </FadeInSection>
    </section>
  );
}
