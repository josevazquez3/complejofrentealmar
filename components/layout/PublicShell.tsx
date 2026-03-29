"use client";

import { ConfiguracionProvider } from "@/components/providers/ConfiguracionContext";
import type { Configuracion } from "@/types";
import { WhatsAppButton } from "@/components/home/WhatsAppButton";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function PublicShell({
  children,
  config,
}: {
  children: React.ReactNode;
  config: Configuracion;
}) {
  return (
    <ConfiguracionProvider value={config}>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <WhatsAppButton />
    </ConfiguracionProvider>
  );
}
