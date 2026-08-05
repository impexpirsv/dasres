import Skeleton from "../components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div>
        <Skeleton className="mb-4 h-12 w-72 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-40 rounded-[var(--ui-radius-card)]" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {[1, 2, 3].map((item) => <Skeleton key={item} className="h-72 rounded-[var(--ui-radius-card)]" />)}
      </div>
      <Skeleton className="h-96 rounded-[var(--ui-radius-card)]" />
    </div>
  );
}
