"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-blanco px-4">
      <h1 className="font-display text-2xl text-nautico-900">Algo salió mal</h1>
      <p className="max-w-md text-center text-sm text-nautico-700/85">
        {error.message || "Volvé a intentar en unos segundos."}
      </p>
      <Button type="button" onClick={reset} className="bg-nautico-800 text-blanco">
        Reintentar
      </Button>
    </div>
  );
}
