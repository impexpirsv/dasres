import Link from "next/link";
import { getTranslations } from "next-intl/server";

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

export default async function DashboardTopRated({
  topRatedExperts,
  topRatedCompanies,
}: Props) {
  const t = await getTranslations("dashboardTopRated");

  return (
    <div className="grid lg:grid-cols-2 gap-6 mt-12">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center gap-4 mb-4">
          <h2 className="text-xl font-bold">
            🏆 {t("experts.title")}
          </h2>

          <Link
            href="/dashboard/experts"
            className="text-blue-400 text-sm hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>

        <div className="space-y-4">
          {topRatedExperts.length === 0 ? (
            <p className="text-slate-500">
              {t("experts.empty")}
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
                  {t("reviewCount", {
                    count: expert.reviewCount,
                  })}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center gap-4 mb-4">
          <h2 className="text-xl font-bold">
            🏆 {t("companies.title")}
          </h2>

          <Link
            href="/dashboard/companies"
            className="text-blue-400 text-sm hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>

        <div className="space-y-4">
          {topRatedCompanies.length === 0 ? (
            <p className="text-slate-500">
              {t("companies.empty")}
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
                  {t("reviewCount", {
                    count: company.reviewCount,
                  })}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}