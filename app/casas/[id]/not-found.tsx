import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CasaNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="font-display text-2xl text-nautico-900">Casa no encontrada</h1>
      <Link href="/" className={cn(buttonVariants({ variant: "default" }), "bg-nautico-800 text-blanco")}>
        Volver al inicio
      </Link>
    </div>
  );
}
