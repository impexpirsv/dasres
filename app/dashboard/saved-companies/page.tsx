import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import EmptyState from "../../components/EmptyState";
export default async function SavedCompaniesPage() {
  const user = await requireUser();

  const savedCompanies = await prisma.savedCompany.findMany({
    where: {
      userId: user.id,
    },
    include: {
      company: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-10">Saved Companies</h1>

        {savedCompanies.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="No saved companies yet"
            description="Save trusted companies to build your trade network."
            buttonText="Browse Companies"
           buttonHref="/dashboard/companies"
          />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {savedCompanies.map((saved) => (
              <div
                key={saved.id}
                className="bg-slate-900 rounded-2xl p-6 border border-slate-800"
              >
                <h2 className="text-2xl font-semibold mb-2">
                  {saved.company.name}
                </h2>

                <p className="text-slate-400">{saved.company.category}</p>

                <p className="text-slate-500 mt-2">{saved.company.country}</p>

                <div className="mt-6">
                  <Link
                    href={`/dashboard/companies/${saved.company.id}`}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl inline-block"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
