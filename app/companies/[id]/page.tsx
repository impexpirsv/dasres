import { prisma } from "../../../lib/prisma";
import DeleteCompanyButton from "../../components/DeleteCompanyButton";
import Link from "next/link";
export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">
          Company Not Found
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="bg-slate-900 rounded-3xl p-10">
          <h1 className="text-5xl font-bold mb-4">
            {company.name}
          </h1>

          <p className="text-blue-400 text-xl mb-4">
            {company.category}
          </p>

          <p className="text-slate-400 mb-2">
            Country: {company.country}
          </p>

          <p className="text-slate-400 mb-2">
            Email: {company.email}
          </p>

          <p className="text-slate-400 mb-2">
            Website: {company.website}
          </p>

          <p className="text-slate-300 text-lg mt-6">
            {company.description}
          </p>

          <div className="mt-8 inline-block bg-green-600 px-4 py-2 rounded-lg">
            {company.status}
          </div>

          <div className="mt-8">
                
            <Link
  href={`/dashboard/companies/${company.id}/edit`}
  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
>
  Edit Company
</Link>
            <DeleteCompanyButton id={company.id} />
            
          </div>
          
        </div>
      </div>
    </div>
  );
}