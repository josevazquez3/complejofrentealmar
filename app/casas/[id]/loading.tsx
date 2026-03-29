import { Skeleton } from "@/components/ui/skeleton";

export default function CasaLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-8 h-12 w-3/4 max-w-md" />
      <Skeleton className="mt-10 aspect-[16/10] w-full rounded-2xl" />
    </div>
  );
}
