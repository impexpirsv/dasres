import Skeleton from "./components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-slate-950 text-white" aria-busy="true">
      <div className="ui-container ui-section">
        <span className="sr-only">Loading</span>
        <div className="grid animate-pulse items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Skeleton className="mb-8 h-10 w-72 max-w-full rounded-full" />
            <Skeleton className="mb-5 h-20 w-full rounded-2xl" />
            <Skeleton className="mb-8 h-20 w-4/5 rounded-2xl" />
            <Skeleton className="mb-3 h-6 w-full" />
            <Skeleton className="mb-10 h-6 w-3/4" />
            <div className="flex flex-col gap-4 sm:flex-row">
              <Skeleton className="h-14 w-full sm:w-40" />
              <Skeleton className="h-14 w-full sm:w-40" />
            </div>
          </div>
          <Skeleton className="h-[420px] rounded-[var(--ui-radius-panel)] sm:h-[520px]" />
        </div>
      </div>
    </main>
  );
}
