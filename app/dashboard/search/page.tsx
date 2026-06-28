import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardSearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  await requireUser();

  const params = await searchParams;
  const q = String(params?.q || "").trim();

  const companies = q
    ? await prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { id: "desc" },
      })
    : [];

  const experts = q
    ? await prisma.expert.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
            { specialty: { contains: q, mode: "insensitive" } },
            { experience: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { id: "desc" },
      })
    : [];

  const opportunities = q
    ? await prisma.opportunity.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { country: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { status: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { id: "desc" },
      })
    : [];

  const cases = q
    ? await prisma.tradeCase.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { id: "desc" },
      })
    : [];

  const totalResults =
    companies.length + experts.length + opportunities.length + cases.length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="mb-10">
        <p className="text-blue-400 font-semibold mb-3">
          Global Search
        </p>

        <h1 className="text-5xl font-bold mb-4">
          Search Dasres
        </h1>

        <p className="text-slate-400">
          Find companies, experts, opportunities and trade cases across your
          workspace.
        </p>
      </div>

      <form className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-10">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search companies, experts, opportunities, cases..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
        />

        <button className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold">
          Search
        </button>
      </form>

      {!q ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-slate-400">
          Enter a keyword to search across Dasres.
        </div>
      ) : (
        <div className="space-y-8">
          <p className="text-slate-400">
            Found {totalResults} result{totalResults === 1 ? "" : "s"} for{" "}
            <span className="text-white font-semibold">"{q}"</span>
          </p>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-5">Companies</h2>

            {companies.length === 0 ? (
              <p className="text-slate-500">No companies found.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {companies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/dashboard/companies/${company.id}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5 hover:border-blue-500 transition"
                  >
                    <p className="font-bold text-lg">{company.name}</p>
                    <p className="text-blue-400 mt-1">{company.category}</p>
                    <p className="text-slate-400 mt-1">{company.country}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-5">Experts</h2>

            {experts.length === 0 ? (
              <p className="text-slate-500">No experts found.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {experts.map((expert) => (
                  <Link
                    key={expert.id}
                    href={`/dashboard/experts/${expert.id}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5 hover:border-cyan-500 transition"
                  >
                    <p className="font-bold text-lg">{expert.name}</p>
                    <p className="text-cyan-400 mt-1">{expert.specialty}</p>
                    <p className="text-slate-400 mt-1">{expert.country}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-5">Opportunities</h2>

            {opportunities.length === 0 ? (
              <p className="text-slate-500">No opportunities found.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {opportunities.map((opportunity) => (
                  <Link
                    key={opportunity.id}
                    href={`/dashboard/opportunities/${opportunity.id}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5 hover:border-purple-500 transition"
                  >
                    <p className="font-bold text-lg">{opportunity.title}</p>
                    <p className="text-purple-400 mt-1">
                      {opportunity.country}
                    </p>
                    <p className="text-slate-400 mt-1">
                      {opportunity.status}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-2xl font-bold mb-5">Trade Cases</h2>

            {cases.length === 0 ? (
              <p className="text-slate-500">No cases found.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {cases.map((tradeCase) => (
                  <Link
                    key={tradeCase.id}
                    href={`/dashboard/cases/${tradeCase.id}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5 hover:border-emerald-500 transition"
                  >
                    <p className="font-bold text-lg">{tradeCase.title}</p>
                    <p className="text-emerald-400 mt-1">
                      {tradeCase.category}
                    </p>
                    <p className="text-slate-400 mt-1">{tradeCase.status}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}