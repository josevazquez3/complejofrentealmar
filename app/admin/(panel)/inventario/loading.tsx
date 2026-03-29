import { Skeleton } from "@/components/ui/skeleton";

export default function InventarioLoading() {
  return (
    <div>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-8 h-72 w-full rounded-xl" />
    </div>
  );
}
