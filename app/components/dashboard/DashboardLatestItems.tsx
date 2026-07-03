import Link from "next/link";

type Props = {
  latestExperts: {
    id: number;
    name: string;
    country: string;
    specialty: string;
  }[];
  latestCompanies: {
    id: number;
    name: string;
    country: string;
    category: string;
  }[];
  latestOpportunities: {
    id: number;
    title: string;
    country: string;
    status: string;
  }[];
  userRole: string;
};

export default function DashboardLatestItems({
  latestExperts,
  latestCompanies,
  latestOpportunities,
  userRole,
}: Props) {
  return (
    <div className="grid lg:grid-cols-3 gap-6 mt-12">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {userRole === "admin" ? "Latest Experts" : "My Latest Experts"}
          </h2>

          <Link
            href={
              userRole === "admin" ? "/experts" : "/dashboard/my-experts"
            }
            className="text-blue-400 text-sm hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="space-y-4">
          {latestExperts.length === 0 ? (
            <p className="text-slate-500">No experts found.</p>
          ) : (
            latestExperts.map((expert) => (
              <Link
                key={expert.id}
                href={`/dashboard/experts/${expert.id}`}
                className="block border-b border-slate-800 pb-3 last:border-0"
              >
                <p className="font-semibold">{expert.name}</p>

                <p className="text-sm text-slate-400">
                  {expert.country} · {expert.specialty}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {userRole === "admin"
              ? "Latest Companies"
              : "My Latest Companies"}
          </h2>

          <Link
            href={
              userRole === "admin"
                ? "/dashboard/companies"
                : "/dashboard/my-companies"
            }
            className="text-blue-400 text-sm hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="space-y-4">
          {latestCompanies.length === 0 ? (
            <p className="text-slate-500">No companies found.</p>
          ) : (
            latestCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/dashboard/companies/${company.id}`}
                className="block border-b border-slate-800 pb-3 last:border-0"
              >
                <p className="font-semibold">{company.name}</p>

                <p className="text-sm text-slate-400">
                  {company.country} · {company.category}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Latest Opportunities</h2>

          <Link
            href="/dashboard/opportunities"
            className="text-blue-400 text-sm hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="space-y-4">
          {latestOpportunities.length === 0 ? (
            <p className="text-slate-500">No opportunities found.</p>
          ) : (
            latestOpportunities.map((opportunity) => (
              <Link
                key={opportunity.id}
                href={`/dashboard/opportunities/${opportunity.id}`}
                className="block border-b border-slate-800 pb-3 last:border-0"
              >
                <p className="font-semibold">{opportunity.title}</p>

                <p className="text-sm text-slate-400">
                  {opportunity.country} · {opportunity.status}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}