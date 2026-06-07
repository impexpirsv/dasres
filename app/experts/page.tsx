import { prisma } from "../../lib/prisma";
import ExpertsList from "../components/ExpertsList.tsx";

export default async function ExpertsPage() {
  const experts = await prisma.expert.findMany();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold mb-4">
          Experts Directory
        </h1>

        <p className="text-slate-400 mb-12">
          Find verified international trade experts.
        </p>

        <ExpertsList experts={experts} />
      </div>
    </div>
  );
}