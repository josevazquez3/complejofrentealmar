"use client";

import { FaFilePdf, FaImage } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

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

  async function openDoc(e: React.MouseEvent) {
    e.preventDefault();
    if (!pathOrUrl) return;
    const path = pathOrUrl;
    if (path.startsWith("http")) {
      window.open(path, "_blank", "noopener,noreferrer");
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("archivos")
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return;
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
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
