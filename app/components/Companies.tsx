
export default function Companies() {
  return (
<section className="bg-slate-900 py-24">
  <div className="max-w-7xl mx-auto px-6">

    <div className="flex justify-between items-center mb-12">
      <div>
        <h2 className="text-4xl font-bold mb-3">
          Featured Companies
        </h2>

        <p className="text-slate-400">
          Discover trusted companies across global markets.
        </p>
      </div>

      <button className="text-blue-400">
        View All →
      </button>
    </div>

    <div className="grid md:grid-cols-3 gap-6">

      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-2xl font-bold">
          China Trade Co.
        </h3>

        <p className="text-blue-400 mt-3">
          Manufacturing & Sourcing
        </p>

        <p className="text-slate-400 mt-4">
          Verified supplier network across China.
        </p>
      </div>

      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-2xl font-bold">
          Global Logistics Ltd
        </h3>

        <p className="text-blue-400 mt-3">
          Shipping & Freight
        </p>

        <p className="text-slate-400 mt-4">
          International logistics and transportation solutions.
        </p>
      </div>

      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
        <h3 className="text-2xl font-bold">
          Trade Bridge Group
        </h3>

        <p className="text-blue-400 mt-3">
          Export Development
        </p>

        <p className="text-slate-400 mt-4">
          Market expansion and international trade consulting.
        </p>
      </div>

    </div>

  </div>
</section>
);
}