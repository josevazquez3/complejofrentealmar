"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-fm-footer px-8 py-6 text-sm leading-relaxed text-gray-400">
      <div className="mx-auto max-w-6xl">
        <p>Copyrights © 2011 Todos los derechos reservados Complejo frente al Mar Azul</p>
        <p className="mt-2">Dirección: Calle 43 y Playa // Mar Azul //Buenos Aires</p>
        <p className="mt-6 text-center text-xs text-gray-500">
          <Link href="/admin/login" className="underline-offset-4 transition-colors hover:text-gray-300 hover:underline">
            Administración
          </Link>
        </p>
      </div>
    </footer>
  );
}
