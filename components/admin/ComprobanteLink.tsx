"use client";

import { FileText, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function isPdf(pathOrUrl: string): boolean {
  return pathOrUrl.toLowerCase().includes(".pdf");
}

function isImage(pathOrUrl: string): boolean {
  return /\.(jpe?g|png|gif|webp)$/i.test(pathOrUrl);
}

/**
 * Abre comprobante en nueva pestaña (URL absoluta o ruta en bucket `archivos`).
 */
export function ComprobanteLink({ pathOrUrl }: { pathOrUrl: string | null }) {
  if (!pathOrUrl) {
    return <span className="text-muted-foreground">—</span>;
  }

  async function openFile(e: React.MouseEvent) {
    e.preventDefault();
    const path = pathOrUrl;
    if (!path) return;
    if (path.startsWith("http")) {
      window.open(path, "_blank", "noopener,noreferrer");
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("archivos")
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) {
      console.error(error);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
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
