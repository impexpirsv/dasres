export default function Services() {
  const services = [
    {
      title: "Trade Case Management",
      icon: "📋",
      description:
        "Create trade cases, receive proposals and manage projects from start to completion.",
    },
    {
      title: "Verified Companies",
      icon: "🏢",
      description:
        "Work with verified companies and build trusted international partnerships.",
    },
    {
      title: "Trusted Experts",
      icon: "👨‍💼",
      description:
        "Find experienced experts across customs, sourcing, logistics and inspection.",
    },
    {
      title: "Proposal Marketplace",
      icon: "🤝",
      description:
        "Receive competitive proposals and select the best provider for each case.",
    },
    {
      title: "Ratings & Reviews",
      icon: "⭐",
      description:
        "Transparent reputation system powered by reviews and trust scores.",
    },
    {
      title: "Documents & Files",
      icon: "📁",
      description:
        "Share project documents and keep all trade information organized.",
    },
    {
      title: "Support Tickets",
      icon: "🎫",
      description:
        "Built-in ticket system for fast communication and issue resolution.",
    },
    {
      title: "Business Network",
      icon: "🌐",
      description:
        "Save companies and experts to build your international trade network.",
    },
  ];

  return (
    <section className="py-28 bg-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            Platform Features
          </div>

          <h2 className="text-5xl font-bold mb-6">
            Everything needed for
            <span className="block text-blue-400">
              international trade
            </span>
          </h2>

          <p className="text-slate-400 max-w-3xl mx-auto text-lg">
            Dasres combines companies, experts, opportunities,
            proposals, reviews and project management into one
            trusted ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-300 rounded-3xl p-7"
            >
              <div className="text-4xl mb-5">
                {service.icon}
              </div>

              <h3 className="text-xl font-bold mb-4">
                {service.title}
              </h3>

              <p className="text-slate-400 leading-7">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}