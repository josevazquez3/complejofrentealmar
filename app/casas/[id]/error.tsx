"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CasaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <p className="text-nautico-800">{error.message}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          Reintentar
        </Button>
        <Link href="/" className={cn(buttonVariants({ variant: "default" }), "bg-nautico-800 text-blanco")}>
          Inicio
        </Link>
      </div>
    </div>
  );
}
