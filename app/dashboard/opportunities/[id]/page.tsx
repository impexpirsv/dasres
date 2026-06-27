import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import DeleteOpportunityButton from "../../../components/DeleteOpportunityButton";
import { formatCountry } from "../../../../lib/format";

type Props = {
  params: Promise<{ id: string }>;
};

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === "OPEN") {
    return (
      <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm">
        Open
      </span>
    );
  }

  if (normalizedStatus === "IN_PROGRESS") {
    return (
      <span className="rounded-full bg-yellow-600 px-4 py-2 text-sm">
        In Progress
      </span>
    );
  }

  if (normalizedStatus === "CLOSED") {
    return (
      <span className="rounded-full bg-red-600 px-4 py-2 text-sm">
        Closed
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-700 px-4 py-2 text-sm">
      {status}
    </span>
  );
}

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
    <div className="max-w-7xl mx-auto px-6 py-12">
      <Link
        href="/dashboard/opportunities"
        className="text-blue-400 hover:underline mb-8 inline-block"
      >
        ← Back to Dashboard Opportunities
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
          {opportunity.imageUrl ? (
            <img
              src={opportunity.imageUrl}
              alt={opportunity.title}
              className="w-full h-80 object-cover"
            />
          ) : (
            <div className="h-80 bg-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-7xl mb-4">🌍</div>

              <p className="text-slate-400">
                Trade Opportunity
              </p>

              <p className="text-slate-500 text-sm mt-1">
                Global Marketplace
              </p>
            </div>
          )}

          <div className="p-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <StatusBadge status={opportunity.status} />

              <span className="rounded-full bg-blue-500/20 px-4 py-2 text-sm text-blue-400">
                {formatCountry(opportunity.country)}
              </span>

              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                Trade Opportunity
              </span>
            </div>

            <h1 className="text-5xl font-black leading-tight mb-8">
              {opportunity.title}
            </h1>

            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-slate-500 text-sm mb-1">
                  Status
                </p>

                <p className="text-2xl font-bold text-emerald-400">
                  {opportunity.status}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-slate-500 text-sm mb-1">
                  Country
                </p>

                <p className="text-2xl font-bold text-blue-400">
                  {formatCountry(opportunity.country)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-slate-500 text-sm mb-1">
                  Visibility
                </p>

                <p className="text-2xl font-bold text-yellow-400">
                  Dashboard
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8">
              <h2 className="text-2xl font-bold mb-4">
                Opportunity Description
              </h2>

              <p className="text-slate-300 leading-8 whitespace-pre-line">
                {opportunity.description}
              </p>
            </div>

            <div className="border-t border-slate-800 pt-8 mt-8">
              <h2 className="text-2xl font-bold mb-4">
                Admin Actions
              </h2>

              <div className="flex flex-wrap gap-3">
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
        </div>

        <aside className="space-y-6">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
            <h2 className="text-2xl font-bold mb-6">
              Opportunity Summary
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-slate-500 text-sm">
                  Country
                </p>

                <p className="text-slate-200">
                  {formatCountry(opportunity.country)}
                </p>
              </div>

              <div>
                <p className="text-slate-500 text-sm">
                  Status
                </p>

                <p className="text-slate-200">
                  {opportunity.status}
                </p>
              </div>

              <div>
                <p className="text-slate-500 text-sm">
                  Type
                </p>

                <p className="text-slate-200">
                  Trade Opportunity
                </p>
              </div>
            </div>

            <Link
              href={`/opportunities/${opportunity.id}`}
              className="mt-6 block text-center bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
            >
              View Public Page
            </Link>

            <Link
              href="/dashboard/opportunities"
              className="mt-3 block text-center bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl"
            >
              Back to Management
            </Link>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              Admin Note
            </h2>

            <p className="text-slate-400 leading-7">
              This page is used for managing trade opportunities inside
              the dashboard. Public visitors see the separate public
              opportunity page.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}