"use client";

import { FaFilePdf, FaImage } from "react-icons/fa";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

function isPdf(pathOrUrl: string): boolean {
  return pathOrUrl.toLowerCase().includes(".pdf");
}

function isImage(pathOrUrl: string): boolean {
  return /\.(jpe?g|png|gif|webp)$/i.test(pathOrUrl);
}

export function ReservaComprobanteCell({ pathOrUrl }: { pathOrUrl: string | null }) {
  if (!pathOrUrl) {
    return (
      <Badge variant="secondary" className="font-normal text-muted-foreground">
        Sin comprobante
      </Badge>
    );
  }

  function openDoc(e: React.MouseEvent) {
    e.preventDefault();
    if (!pathOrUrl) return;
    if (pathOrUrl.startsWith("http")) {
      window.open(pathOrUrl, "_blank", "noopener,noreferrer");
      return;
    }
    toast.error("Solo se pueden abrir comprobantes con URL https. Volvé a subirlo desde editar reserva.");
  }

  const pdf = isPdf(pathOrUrl);
  const img = isImage(pathOrUrl);

  return (
    <button
      type="button"
      onClick={openDoc}
      className="inline-flex items-center gap-2 text-sm font-medium text-nautico-700 underline-offset-4 hover:underline"
    >
      {pdf ? (
        <>
          <FaFilePdf className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
          Ver PDF
        </>
      ) : img ? (
        <>
          <FaImage className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
          Ver imagen
        </>
      ) : (
        <>
          <FaFilePdf className="h-5 w-5 shrink-0 text-nautico-600" aria-hidden />
          Ver archivo
        </>
      )}
    </button>
  );
}
