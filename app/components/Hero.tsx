import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.18),_transparent_35%)]" />
      <div className="absolute inset-0 bg-slate-950/80" />

      <div className="relative max-w-7xl mx-auto px-6 py-28 lg:py-32 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Verified trade network for global B2B services
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
            Build trust in
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              global trade
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-8 mb-10">
            Dasres connects verified companies, trusted experts and trade
            opportunities through one case-based platform for international
            business.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 px-7 py-4 rounded-xl font-semibold text-center shadow-lg shadow-blue-600/25"
            >
              Join Dasres
            </Link>

            <Link
              href="/experts"
              className="border border-slate-700 hover:border-blue-500 bg-slate-900/60 px-7 py-4 rounded-xl font-semibold text-center"
            >
              Explore Experts
            </Link>

            <Link
              href="/companies"
              className="border border-slate-700 hover:border-cyan-500 bg-slate-900/60 px-7 py-4 rounded-xl font-semibold text-center"
            >
              Browse Companies
            </Link>
          </div>

        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[3rem] bg-blue-500/10 blur-3xl" />

          <div className="relative rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 mb-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-slate-500 text-sm">Live trade case</p>
                  <h2 className="text-2xl font-bold mt-1">
                    Customs Clearance UAE
                  </h2>
                </div>

                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-sm text-emerald-300">
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                  <p className="text-slate-500 text-xs">Proposals</p>
                  <p className="text-2xl font-bold text-blue-400">6</p>
                </div>

                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                  <p className="text-slate-500 text-xs">Trust</p>
                  <p className="text-2xl font-bold text-emerald-400">83%</p>
                </div>

                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                  <p className="text-slate-500 text-xs">Status</p>
                  <p className="text-sm font-bold text-yellow-400 mt-2">
                    In Progress
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-slate-500 text-sm mb-2">Top company</p>
                <h3 className="text-xl font-bold">Sina Customs</h3>
                <p className="text-blue-400 mt-1">Customs Clearance</p>
                <p className="text-yellow-400 mt-4">⭐ 5.0 Rating</p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-slate-500 text-sm mb-2">Top expert</p>
                <h3 className="text-xl font-bold">Ahad Customs</h3>
                <p className="text-cyan-400 mt-1">Trade Consultant</p>
                <p className="text-emerald-400 mt-4">✓ Verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}