"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Loader2, Settings, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Configuracion } from "@/types";
import { guardarConfiguracion } from "@/app/admin/(panel)/configuracion/actions";
import { uploadImage } from "@/app/actions/configuracion";
import { WHATSAPP_MENSAJE_DEFAULT } from "@/lib/wa-reserva-confirmacion";

const section = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4 },
  }),
};

export function ConfiguracionForm({
  initial,
  sinFilaEnBd = false,
}: {
  initial: Configuracion;
  sinFilaEnBd?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [whatsappMensaje, setWhatsappMensaje] = useState(initial.whatsapp_mensaje ?? "");
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    setWhatsappMensaje(initial.whatsapp_mensaje ?? "");
  }, [initial.whatsapp_mensaje]);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await guardarConfiguracion(formData);
      if (res.success) {
        toast.success(sinFilaEnBd ? "Configuración creada" : "Cambios guardados");
        router.refresh();
      } else {
        toast.error(res.error ?? "No se pudo guardar");
      }
    });
  }

  const onUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("folder", "logos");
      const { url } = await uploadImage(fd);
      setLogoUrl(url);
      toast.success("Logo subido. Guardá los cambios para aplicarlo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir el logo");
    } finally {
      setUploadingLogo(false);
    }
  };


  return (
    <div>
      {sinFilaEnBd ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-nautico-900">
          <p className="font-medium">Aún no hay registro en la tabla configuración.</p>
          <p className="mt-1 text-nautico-800/90">
            Completá el formulario y guardá: se creará la fila automáticamente (no hace falta SQL manual).
          </p>
        </div>
      ) : null}
      <div className="mb-8 flex items-center gap-3">
        <Settings className="h-8 w-8 text-arena-600" aria-hidden />
        <h1 className="font-display text-3xl font-semibold text-nautico-900">
          Configuración del complejo
        </h1>
      </div>

      <form action={onSubmit} className="max-w-3xl space-y-10">
        <input type="hidden" name="id" value={initial.id} />

        <motion.section
          custom={0}
          initial="hidden"
          animate="show"
          variants={section}
          className="space-y-4 rounded-2xl border border-nautico-900/10 bg-white p-6 shadow-sm"
        >
          <h2 className="font-display text-lg text-nautico-800">Información general</h2>
          <div className="space-y-2">
            <Label htmlFor="complejo_nombre">Nombre del complejo</Label>
            <Input
              id="complejo_nombre"
              name="complejo_nombre"
              defaultValue={initial.complejo_nombre}
              required
              className="rounded-xl"
            />
          </div>
         <div className="space-y-2">
            <Label htmlFor="logo_url">URL del logo (header)</Label>
            <div className="flex gap-2">
              <Input
                id="logo_url"
                name="logo_url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
                className="rounded-xl"
              />
              <label className="cursor-pointer shrink-0">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  disabled={uploadingLogo}
                  onChange={(e) => void onUploadLogo(e)}
                />
                <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-nautico-900/20 bg-white px-3 text-sm font-medium text-nautico-900 hover:bg-nautico-900/5">
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Subir
                </span>
              </label>
            </div>
            {logoUrl && (
              <div className="flex items-center gap-3 rounded-lg border border-nautico-900/10 bg-nautico-900/5 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="Preview logo" className="h-10 object-contain" />
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="ml-auto text-xs text-red-500 hover:text-red-700"
                >
                  Quitar
                </button>
              </div>
            )}
            <p className="text-xs text-nautico-600/90">
              Opcional. Si está vacío se muestra la marca &quot;FM&quot;.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline / slogan</Label>
            <Input id="tagline" name="tagline" defaultValue={initial.tagline ?? ""} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion_home">Texto de bienvenida</Label>
            <Textarea
              id="descripcion_home"
              name="descripcion_home"
              defaultValue={initial.descripcion_home ?? ""}
              rows={6}
              className="min-h-[120px] rounded-xl"
            />
          </div>
        </motion.section>

        <motion.section
          custom={1}
          initial="hidden"
          animate="show"
          variants={section}
          className="space-y-4 rounded-2xl border border-nautico-900/10 bg-white p-6 shadow-sm"
        >
          <h2 className="font-display text-lg text-nautico-800">Ubicación</h2>
          <div className="space-y-2">
            <Label htmlFor="ubicacion_direccion">Dirección</Label>
            <Input
              id="ubicacion_direccion"
              name="ubicacion_direccion"
              defaultValue={initial.ubicacion_direccion ?? ""}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapa_query">Coordenadas del mapa (lat,lng)</Label>
            <Input
              id="mapa_query"
              name="mapa_query"
              defaultValue={initial.mapa_query ?? ""}
              placeholder="-37.2636,-56.9789"
              className="rounded-xl"
            />
          </div>
        </motion.section>

        <motion.section
          custom={2}
          initial="hidden"
          animate="show"
          variants={section}
          className="space-y-4 rounded-2xl border border-nautico-900/10 bg-white p-6 shadow-sm"
        >
          <h2 className="font-display text-lg text-nautico-800">Contacto y redes</h2>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_e164">Número de WhatsApp</Label>
            <Input
              id="whatsapp_e164"
              name="whatsapp_e164"
              defaultValue={initial.whatsapp_e164 ?? ""}
              placeholder="5492215000000"
              className="rounded-xl"
            />
            <p className="text-xs text-nautico-600/90">
              Ingresá el número sin &apos;+&apos; ni espacios. Ejemplo: 5492215000000. Se usa en los botones del sitio
              público y para habilitar la confirmación de reservas desde el panel admin.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_mensaje">Mensaje de confirmación WhatsApp</Label>
            <textarea
              id="whatsapp_mensaje"
              name="whatsapp_mensaje"
              value={whatsappMensaje}
              onChange={(e) => setWhatsappMensaje(e.target.value)}
              rows={10}
              placeholder={WHATSAPP_MENSAJE_DEFAULT}
              className="w-full min-h-[12rem] resize-y rounded-xl border border-nautico-900/15 bg-white px-3 py-2 text-sm text-nautico-900 shadow-sm outline-none ring-nautico-900/20 focus:ring-2"
            />
            <div className="rounded-lg border border-nautico-900/10 bg-nautico-50/80 px-3 py-2 text-xs text-nautico-800/90">
              <p className="font-medium text-nautico-900">Variables disponibles:</p>
              <p className="mt-1 font-mono leading-relaxed">
                {"{nombre}"} {"{apellido}"} {"{complejo}"} {"{fecha_inicio}"} {"{fecha_fin}"}{" "}
                {"{unidad}"} {"{adultos}"} {"{ninos}"} {"{mascotas}"} {"{senia}"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-nautico-900/20"
              onClick={() => setWhatsappMensaje(WHATSAPP_MENSAJE_DEFAULT)}
            >
              Restaurar mensaje por defecto
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_contacto">Email de contacto</Label>
            <Input
              id="email_contacto"
              name="email_contacto"
              type="email"
              defaultValue={initial.email_contacto ?? ""}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook_url">URL Facebook</Label>
            <Input
              id="facebook_url"
              name="facebook_url"
              type="url"
              defaultValue={initial.facebook_url ?? ""}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram_url">URL Instagram</Label>
            <Input
              id="instagram_url"
              name="instagram_url"
              type="url"
              defaultValue={initial.instagram_url ?? ""}
              className="rounded-xl"
            />
          </div>
        </motion.section>

        <Button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-arena-500 py-6 text-base text-nautico-900 hover:bg-arena-400"
        >
          {pending ? "Guardando…" : sinFilaEnBd ? "Crear configuración" : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}
