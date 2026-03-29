import { PublicShell } from "./PublicShell";
import type { Configuracion } from "@/types";

export function PublicLayout({
  children,
  config,
}: {
  children: React.ReactNode;
  config: Configuracion;
}) {
  return <PublicShell config={config}>{children}</PublicShell>;
}
