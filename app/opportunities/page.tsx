import { prisma } from "../../lib/prisma";
import OpportunitiesList from "../components/OpportunitiesList.tsx";

export default async function OpportunitiesPage() {
  const opportunities = await prisma.opportunity.findMany();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold mb-4">
          Trade Opportunities
        </h1>

        <p className="text-slate-400 mb-12">
          Discover international business opportunities and partnerships.
        </p>

        <OpportunitiesList opportunities={opportunities} />
      </div>
    </div>
  );
}