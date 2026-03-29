"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PaginationBar({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function href(p: number): string {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-nautico-700">
      <span>
        Página {currentPage} de {totalPages}
      </span>
      <div className="flex gap-2">
        {currentPage <= 1 ? (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50"
            )}
          >
            Anterior
          </span>
        ) : (
          <Link
            href={href(currentPage - 1)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Anterior
          </Link>
        )}
        {currentPage >= totalPages ? (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50"
            )}
          >
            Siguiente
          </span>
        ) : (
          <Link
            href={href(currentPage + 1)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Siguiente
          </Link>
        )}
      </div>
    </div>
  );
}
