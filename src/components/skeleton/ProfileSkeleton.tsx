import { Skeleton } from "@/components/skeleton/Skeleton";

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="w-full shrink-0 lg:w-64">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="mt-3 h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>

          <div className="mt-6 space-y-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-border bg-surface p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-64" />

        <div className="mt-6 space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
