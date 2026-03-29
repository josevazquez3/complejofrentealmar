import { Skeleton } from "@/components/ui/skeleton";

export default function TesoreriaLoading() {
  return (
    <div>
      <Skeleton className="h-9 w-44" />
      <Skeleton className="mt-8 h-64 w-full rounded-xl" />
    </div>
  );
}
