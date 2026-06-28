export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-28">
        <div className="animate-pulse grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="h-10 w-72 rounded-full bg-slate-800 mb-8" />
            <div className="h-20 w-full rounded-2xl bg-slate-800 mb-5" />
            <div className="h-20 w-4/5 rounded-2xl bg-slate-800 mb-8" />
            <div className="h-6 w-full rounded-xl bg-slate-800 mb-3" />
            <div className="h-6 w-3/4 rounded-xl bg-slate-800 mb-10" />

            <div className="flex gap-4">
              <div className="h-14 w-40 rounded-xl bg-slate-800" />
              <div className="h-14 w-40 rounded-xl bg-slate-800" />
            </div>
          </div>

          <div className="h-[520px] rounded-[2rem] bg-slate-900 border border-slate-800" />
        </div>
      </div>
    </main>
  );
}