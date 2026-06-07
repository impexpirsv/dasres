import { prisma } from "../../lib/prisma";
import CompaniesList from "../components/CompaniesList";

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold mb-4">
          Companies Directory
        </h1>

        <p className="text-slate-400 mb-12">
          Discover verified companies across global markets.
        </p>

        <CompaniesList companies={companies} />
      </div>
    </div>
  );
}