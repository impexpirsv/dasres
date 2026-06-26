import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import DeleteOpportunityButton from "../../../components/DeleteOpportunityButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DashboardOpportunityDetailPage({
  params,
}: Props) {
  const { id } = await params;
  const opportunityId = Number(id);

  if (!opportunityId) {
    notFound();
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: {
      id: opportunityId,
    },
  });

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <Link
        href="/dashboard/opportunities"
        className="text-blue-400 hover:underline"
      >
        ← Back to Opportunities
      </Link>

      <div className="mt-8 bg-slate-900 rounded-3xl p-8 border border-slate-800">
        {opportunity.imageUrl && (
          <img
            src={opportunity.imageUrl}
            alt={opportunity.title}
            className="w-full h-72 object-cover rounded-2xl mb-8"
          />
        )}

        <h1 className="text-5xl font-bold mb-4">
          {opportunity.title}
        </h1>

        <div className="flex flex-wrap gap-3 mb-8">
          <span className="bg-green-600 px-4 py-2 rounded-full text-sm">
            {opportunity.status}
          </span>

          <span className="bg-slate-800 px-4 py-2 rounded-full text-sm">
            {opportunity.country}
          </span>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <h2 className="text-2xl font-bold mb-4">
            Opportunity Description
          </h2>

          <p className="text-slate-300 leading-8 whitespace-pre-line">
            {opportunity.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-8">
          <Link
            href={`/dashboard/opportunities/${opportunity.id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
          >
            Edit Opportunity
          </Link>

         <DeleteOpportunityButton id={opportunity.id} />
        </div>
      </div>
    </div>
  );
}