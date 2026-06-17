import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function OpenCasesPage() {
  const user = await requireUser();

  const myCompanies = await prisma.company.findMany({
    where: {
      ownerId: user.id,
    },
    select: {
      id: true,
      name: true,
      category: true,
      ownerId: true,
    },
  });

  const categories = [
    ...new Set(
      myCompanies
        .map((company) => company.category)
        .filter(Boolean)
    ),
  ];

  console.log("OPEN CASES DEBUG USER:", user);
  console.log("OPEN CASES DEBUG COMPANIES:", myCompanies);
  console.log("OPEN CASES DEBUG CATEGORIES:", categories);

  const openCases = await prisma.tradeCase.findMany({
    where: {
      status: "OPEN",
      category: {
        in: categories,
      },
      NOT: {
        customerId: user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log("OPEN CASES DEBUG CASES:", openCases);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-3">
          Open Cases
        </h1>

        <p className="text-slate-400 mb-10">
          Cases matched to your company categories.
        </p>

        <div className="space-y-4">
          {openCases.map((tradeCase) => (
            <div
              key={tradeCase.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                  {tradeCase.category}
                </span>

                <span className="bg-slate-800 px-3 py-1 rounded-full text-sm">
                  {tradeCase.status}
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-2">
                {tradeCase.title}
              </h2>

              <p className="text-slate-400 mb-5">
                {tradeCase.description}
              </p>

              <Link
                href={`/dashboard/cases/${tradeCase.id}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl"
              >
                View Case
              </Link>
            </div>
          ))}

          {openCases.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
              No matching open cases found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}