import { Skeleton } from "@/components/ui/skeleton";

export default function InventarioCategoriasLoading() {
  return (
    <div>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-4 h-5 w-full max-w-md" />
      <Skeleton className="mt-8 h-56 w-full rounded-xl" />
    </div>
  );
}
