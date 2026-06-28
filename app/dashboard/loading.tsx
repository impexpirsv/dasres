export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="animate-pulse space-y-8">
        <div>
          <div className="h-12 w-72 rounded-xl bg-slate-800 mb-4" />
          <div className="h-5 w-96 rounded-xl bg-slate-800" />
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-40 rounded-3xl bg-slate-900 border border-slate-800"
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 rounded-3xl bg-slate-900 border border-slate-800"
            />
          ))}
        </div>

        <div className="h-96 rounded-3xl bg-slate-900 border border-slate-800" />
      </div>
    </div>
  );
}