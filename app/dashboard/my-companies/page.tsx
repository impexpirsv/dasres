import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function MyCompaniesPage() {
  const user = await requireUser();

  const companies = await prisma.company.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      id: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            My Companies
          </h1>

          <Link
            href="/dashboard/companies/new"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
          >
            Add Company
          </Link>
        </div>

        {companies.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            You do not own any companies yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500"
              >
                <h2 className="text-2xl font-bold mb-2">
                  {company.name}
                </h2>

                <p className="text-blue-400 mb-2">
                  {company.category}
                </p>

                <p className="text-slate-400">
                  {company.country}
                </p>

                <div className="mt-4 flex gap-2">
                  <span className="bg-slate-800 px-3 py-1 rounded-full text-sm">
                    {company.status}
                  </span>

                  <span className="bg-slate-800 px-3 py-1 rounded-full text-sm">
                    {company.verificationStatus}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}