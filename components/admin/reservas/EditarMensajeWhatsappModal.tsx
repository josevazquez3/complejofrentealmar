"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

type Props = {
  open: boolean;
  mensaje: string;
  onClose: () => void;
  onChange: (val: string) => void;
  onRestaurar: () => void;
  onGuardar: () => void | Promise<void>;
  guardando: boolean;
  guardadoOk: boolean;
};

export function EditarMensajeWhatsappModal({
  open,
  mensaje,
  onClose,
  onChange,
  onRestaurar,
  onGuardar,
  guardando,
  guardadoOk,
}: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="wa-edit-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="editar-wa-titulo"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="relative z-10 w-full max-w-[min(92vw,36rem)] max-h-[min(85vh,40rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="editar-wa-titulo" className="text-lg font-semibold text-gray-800">
                Editar Mensaje de Confirmación WhatsApp
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-fm-muted hover:bg-gray-100 hover:text-gray-800"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {guardadoOk ? (
              <p className="mt-6 text-center text-sm font-medium text-green-700">
                ✅ Mensaje guardado correctamente
              </p>
            ) : (
              <>
                <textarea
                  rows={10}
                  className="mt-4 w-full resize-y rounded-lg border border-fm-border px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-500/60"
                  value={mensaje}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={guardando}
                />
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-fm-muted">
                  <p className="font-medium text-gray-700">Variables disponibles</p>
                  <p className="mt-1 font-mono leading-relaxed">
                    {"{nombre} {apellido} {complejo} {fecha_inicio} {fecha_fin}"}
                    <br />
                    {"{unidad} {adultos} {ninos} {mascotas} {senia}"}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onRestaurar}
                    disabled={guardando}
                    className="rounded-lg border border-fm-border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Restaurar por defecto
                  </button>
                  <button
                    type="button"
                    onClick={() => void onGuardar()}
                    disabled={guardando}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#20bd5a] disabled:opacity-60"
                  >
                    {guardando ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
                    <FaWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                    Guardar
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
