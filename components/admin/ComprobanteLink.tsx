"use client";

import { FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

function isPdf(pathOrUrl: string): boolean {
  return pathOrUrl.toLowerCase().includes(".pdf");
}

function isImage(pathOrUrl: string): boolean {
  return /\.(jpe?g|png|gif|webp)$/i.test(pathOrUrl);
}

/** Abre comprobante en nueva pestaña si es una URL https pública. */
export function ComprobanteLink({ pathOrUrl }: { pathOrUrl: string | null }) {
  if (!pathOrUrl) {
    return <span className="text-muted-foreground">—</span>;
  }

  function openFile(e: React.MouseEvent) {
    e.preventDefault();
    const path = pathOrUrl;
    if (!path) return;
    if (path.startsWith("http")) {
      window.open(path, "_blank", "noopener,noreferrer");
      return;
    }
    toast.error("Solo se pueden abrir comprobantes con URL https. Subí el archivo de nuevo desde el panel.");
  }

  const pdf = isPdf(pathOrUrl);
  const img = isImage(pathOrUrl);

  return (
    <button
      type="button"
      onClick={openFile}
      className="inline-flex items-center gap-1 text-sm font-medium text-nautico-700 underline-offset-4 hover:underline"
    >
      {pdf ? (
        <FileText className="h-5 w-5 text-red-600" aria-hidden />
      ) : img ? (
        <ImageIcon className="h-5 w-5 text-blue-600" aria-hidden />
      ) : (
        <FileText className="h-5 w-5 text-nautico-600" aria-hidden />
      )}
      Ver
    </button>
  );
}
