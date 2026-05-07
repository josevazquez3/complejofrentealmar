"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-fm-footer px-8 py-10 text-sm leading-relaxed text-gray-400">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">

          <div>
            <p className="mb-2 text-base font-semibold text-white">Complejo Frente al Mar</p>
            <p>Calle 43 y Playa</p>
            <p>Mar Azul, Buenos Aires</p>
            <p className="mt-3 text-xs text-gray-500">
              Copyrights © 2011 Todos los derechos reservados
            </p>
          </div>

          <div>
            <p className="mb-2 text-base font-semibold text-white">Contacto</p>
            <a href="https://wa.me/5492215550313" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors hover:text-white">
              <span>📱</span>
              <span>+549.2215.550313 WhatsApp</span>
            </a>
            <a href="mailto:info@complejofrentealmar.com.ar" className="mt-1 flex items-center gap-2 transition-colors hover:text-white">
              <span>✉️</span>
              <span>info@complejofrentealmar.com.ar</span>
            </a>
          </div>

          <div>
            <p className="mb-2 text-base font-semibold text-white">¿Consultas?</p>
            <p className="mb-3 text-xs">Envianos tu mensaje y te respondemos a la brevedad.</p>
            <a href="https://wa.me/5492215550313" target="_blank" rel="noopener noreferrer" className="inline-block rounded border border-white/20 bg-white/10 px-4 py-2 text-xs text-white transition-colors hover:bg-white/20">
              Enviar consulta
            </a>
          </div>

        </div>

        <div className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-gray-500">
          <Link href="/admin/login" className="underline-offset-4 transition-colors hover:text-gray-300 hover:underline">
            Administración
          </Link>
        </div>
      </div>
    </footer>
  );
}