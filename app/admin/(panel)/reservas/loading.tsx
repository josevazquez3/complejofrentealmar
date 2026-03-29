import { Skeleton } from "@/components/ui/skeleton";

export default function ReservasLoading() {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-56" />
      </div>
      <Skeleton className="mt-4 h-4 w-48" />
      <div className="mt-6 space-y-2 rounded-xl border border-nautico-900/10 p-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full animate-pulse" />
        ))}
      </div>
    </div>
  );
}
