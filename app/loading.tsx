import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-blanco p-6">
      <Skeleton className="mx-auto h-12 max-w-7xl rounded-lg" />
      <Skeleton className="mx-auto mt-6 h-[50vh] max-w-7xl rounded-2xl" />
      <div className="mx-auto mt-10 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
