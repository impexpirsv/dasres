import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import DeleteOpportunityButton from "../../components/DeleteOpportunityButton";
export default async function OpportunityProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const opportunity =
    await prisma.opportunity.findUnique({
      where: {
        id: Number(id),
      },
    });

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">
          Opportunity Not Found
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="bg-slate-900 rounded-3xl p-10">
          <h1 className="text-5xl font-bold mb-4">
            {opportunity.title}
          </h1>

          <div className="text-green-400 text-xl mb-4">
            {opportunity.status}
          </div>

          <p className="text-blue-400 text-xl mb-4">
            {opportunity.country}
          </p>

          <p className="text-slate-300 text-lg">
            {opportunity.description}
          </p>
          <div className="mt-8">
            <Link
  href={`/dashboard/opportunities/${opportunity.id}/edit`}
  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
>
  Edit Opportunity
</Link>
  <DeleteOpportunityButton
    id={opportunity.id}
  />
</div>
        </div>
      </div>
      
    </div>
  );
}