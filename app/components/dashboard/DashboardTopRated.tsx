import Link from "next/link";

type Expert = {
  id: number;
  name: string;
  country: string;
  specialty: string;
  averageRating: number;
  reviewCount: number;
};

type Company = {
  id: number;
  name: string;
  country: string;
  category: string;
  averageRating: number;
  reviewCount: number;
};

type Props = {
  topRatedExperts: Expert[];
  topRatedCompanies: Company[];
};

export default function DashboardTopRated({
  topRatedExperts,
  topRatedCompanies,
}: Props) {
  return (
    <div className="grid lg:grid-cols-2 gap-6 mt-12">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            🏆 Top Rated Experts
          </h2>

          <Link
            href="/dashboard/experts"
            className="text-blue-400 text-sm hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="space-y-4">
          {topRatedExperts.length === 0 ? (
            <p className="text-slate-500">
              No rated experts yet.
            </p>
          ) : (
            topRatedExperts.map((expert) => (
              <Link
                key={expert.id}
                href={`/dashboard/experts/${expert.id}`}
                className="block bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-blue-500"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {expert.name}
                    </p>

                    <p className="text-sm text-slate-400">
                      {expert.country} · {expert.specialty}
                    </p>
                  </div>

                  <div className="text-yellow-400 font-semibold whitespace-nowrap">
                    ⭐ {expert.averageRating.toFixed(1)}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Based on {expert.reviewCount} review
                  {expert.reviewCount > 1 ? "s" : ""}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            🏆 Top Rated Companies
          </h2>

          <Link
            href="/dashboard/companies"
            className="text-blue-400 text-sm hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="space-y-4">
          {topRatedCompanies.length === 0 ? (
            <p className="text-slate-500">
              No rated companies yet.
            </p>
          ) : (
            topRatedCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/dashboard/companies/${company.id}`}
                className="block bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-blue-500"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {company.name}
                    </p>

                    <p className="text-sm text-slate-400">
                      {company.country} · {company.category}
                    </p>
                  </div>

                  <div className="text-yellow-400 font-semibold whitespace-nowrap">
                    ⭐ {company.averageRating.toFixed(1)}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Based on {company.reviewCount} review
                  {company.reviewCount > 1 ? "s" : ""}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}