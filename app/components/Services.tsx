export default function Services() {
  const workflow = [
    {
      step: "01",
      title: "Create a trade case",
      icon: "📋",
      description:
        "Submit your trade request with category, scope and service details.",
    },
    {
      step: "02",
      title: "Match with providers",
      icon: "🏢",
      description:
        "Dasres connects the case to verified companies and experts by category.",
    },
    {
      step: "03",
      title: "Receive proposals",
      icon: "🤝",
      description:
        "Compare price, message, provider profile, verification and reputation.",
    },
    {
      step: "04",
      title: "Assign the winner",
      icon: "✅",
      description:
        "Accept one proposal, reject the rest and start the active case workflow.",
    },
    {
      step: "05",
      title: "Manage delivery",
      icon: "📁",
      description:
        "Keep messages, documents, timeline steps and activity logs in one place.",
    },
    {
      step: "06",
      title: "Complete and review",
      icon: "⭐",
      description:
        "Close the case, submit reviews and build trust for future projects.",
    },
  ];

  return (
    <section className="relative overflow-hidden py-28 bg-slate-900 border-y border-slate-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.1),_transparent_34%)]" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-14 items-start">
          <div className="lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm mb-6">
              Platform Workflow
            </div>

            <h2 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              From request to
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                trusted delivery.
              </span>
            </h2>

            <p className="text-slate-400 text-lg leading-8 mb-8">
              Dasres is not just a directory. It is a case-based operating layer
              for international trade services, proposals, documents,
              communication and reputation.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <p className="text-3xl font-bold text-blue-400">1</p>
                <p className="text-slate-400 mt-2">Unified workflow</p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <p className="text-3xl font-bold text-emerald-400">360°</p>
                <p className="text-slate-400 mt-2">Case visibility</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="group rounded-3xl border border-slate-800 bg-slate-950/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="text-4xl">{item.icon}</div>

                  <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-400 group-hover:border-blue-500/60 group-hover:text-blue-300">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-2xl font-bold mb-4">
                  {item.title}
                </h3>

                <p className="text-slate-400 leading-7">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}