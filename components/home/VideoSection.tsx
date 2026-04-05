import { FadeInSection } from "@/components/home/FadeInSection";

export function VideoSection({ youtubeVideoId }: { youtubeVideoId?: string | null }) {
  const id = youtubeVideoId?.trim() ?? "";

  return (
    <section className="bg-white py-16 text-center">
      <FadeInSection className="mx-auto max-w-4xl px-4">
        <p className="mb-2 text-base italic text-fm-red">Complejo en Mar Azul.</p>
        <h2 className="mb-8 text-2xl font-bold tracking-widest">VIDEO INSTITUCIONAL</h2>

        {id ? (
          <div className="mx-auto max-w-2xl overflow-hidden rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
            <div className="aspect-video w-full">
              <iframe
                title="Video institucional Complejo Frente al Mar Azul"
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-lg border border-dashed border-fm-border bg-gray-50 px-6 py-12 text-fm-muted">
            <p className="text-sm">
              Configurá el video en el panel:{" "}
              <strong className="text-fm-text">Admin → Editar sitio → pestaña Video</strong> (ID o URL de YouTube).
            </p>
          </div>
        )}

        <p className="mx-auto mt-6 max-w-xl text-center text-fm-muted">
          Lo invitamos a que vea nuestro video institucional y pueda apreciar mejor las instalaciones con una
          inmejorable ubicación.
        </p>
      </FadeInSection>
    </section>
  );
}
