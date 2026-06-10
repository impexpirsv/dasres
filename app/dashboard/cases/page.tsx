import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
export default async function CasesPage() {
  const user = await requireUser();
  const cases = await prisma.tradeCase.findMany({
  where:
    user.role === "admin"
      ? {}
      : {
          customerId: user.id,
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
            Trade Cases
          </h1>

          <Link
            href="/dashboard/cases/new"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
          >
            New Case
          </Link>
        </div>

        <div className="bg-slate-900 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4">
                  ID
                </th>

                <th className="text-left p-4">
                  Title
                </th>

                <th className="text-left p-4">
                  Status
                </th>

                <th className="text-left p-4">
                  Created
                </th>
              </tr>
            </thead>

            <tbody>
              {cases.map((tradeCase) => (
                <tr
                  key={tradeCase.id}
                  className="border-b border-slate-800"
                >
                  <td className="p-4">
                    #{tradeCase.id}
                  </td>

                  <td className="p-4">
  <Link
    href={`/dashboard/cases/${tradeCase.id}`}
    className="text-blue-400 hover:underline"
  >
    {tradeCase.title}
  </Link>
</td>

                  <td className="p-4">
                    {tradeCase.status}
                  </td>

                  <td className="p-4">
                    {tradeCase.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {cases.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-slate-500"
                  >
                    No cases found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}