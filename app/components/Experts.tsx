export default function Experts() {
  return (
<section className="bg-slate-950 py-24">
  <div className="max-w-7xl mx-auto px-6">

    <div className="flex justify-between items-center mb-12">
      <div>
        <h2 className="text-4xl font-bold mb-3">
          Featured Experts
        </h2>

        <p className="text-slate-400">
          Connect with trusted international trade professionals.
        </p>
      </div>

      <button className="text-blue-400">
        View All →
      </button>
    </div>

    <div className="grid md:grid-cols-3 gap-6">

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <div className="text-5xl mb-4">👨‍💼</div>

        <h3 className="text-xl font-semibold">
          David Chen
        </h3>

        <p className="text-blue-400 mt-2">
          China Sourcing Expert
        </p>

        <p className="text-slate-400 mt-4">
          12 years experience in sourcing and supplier verification.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <div className="text-5xl mb-4">👩‍💼</div>

        <h3 className="text-xl font-semibold">
          Rita Moradi
        </h3>

        <p className="text-blue-400 mt-2">
          Trade Consultant
        </p>

        <p className="text-slate-400 mt-4">
          International trade strategy and market development specialist.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
        <div className="text-5xl mb-4">👨‍💼</div>

        <h3 className="text-xl font-semibold">
          Seid Rahimi
        </h3>

        <p className="text-blue-400 mt-2">
          Logistics Expert
        </p>

        <p className="text-slate-400 mt-4">
          Air, sea and multimodal transportation consultant.
        </p>
      </div>

    </div>

  </div>
</section>
  );
}