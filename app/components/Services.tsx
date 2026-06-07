export default function Services() {
  return (
    <section className="bg-slate-900 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Trade Services</h2>

          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything you need for international trade in one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-semibold mb-3">Sourcing</h3>
            <p className="text-slate-400">
              Find suppliers and manufacturers worldwide.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-semibold mb-3">Inspection</h3>
            <p className="text-slate-400">
              Quality control and product inspection services.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-semibold mb-3">Logistics</h3>
            <p className="text-slate-400">
              Air, sea and land transportation services.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-semibold mb-3">Customs</h3>
            <p className="text-slate-400">
              Customs clearance and trade compliance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}