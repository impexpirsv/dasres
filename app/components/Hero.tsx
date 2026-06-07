export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-950 to-slate-950" />

      <div className="relative max-w-7xl mx-auto px-6 py-28 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-blue-400 font-semibold mb-4">
            Global B2B Trade Platform
          </p>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Trust Ecosystem
            <br />
            for Global Trade
          </h1>

          <p className="text-lg text-slate-300 max-w-xl mb-10">
            Dasres connects verified experts, companies, suppliers and
            international trade opportunities through one trusted global
            platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-blue-600 px-7 py-4 rounded-xl font-semibold">
              Join Dasres
            </button>

            <button className="border border-slate-600 px-7 py-4 rounded-xl font-semibold">
              Explore Experts
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-14 max-w-lg">
            <div>
              <h3 className="text-3xl font-bold">50+</h3>
              <p className="text-slate-400 text-sm">Countries</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold">8+</h3>
              <p className="text-slate-400 text-sm">Service Categories</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold">24/7</h3>
              <p className="text-slate-400 text-sm">Global Access</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="w-full aspect-square rounded-full bg-blue-600/20 border border-blue-400/30 flex items-center justify-center">
            <div className="w-4/5 aspect-square rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-400/10 border border-blue-300/30 flex items-center justify-center">
              <div className="text-center">
                <div className="text-7xl mb-6">🌍</div>

                <h2 className="text-2xl font-bold">
                  Global Trade Network
                </h2>

                <p className="text-slate-300 mt-3">
                  Experts • Companies • Opportunities
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}