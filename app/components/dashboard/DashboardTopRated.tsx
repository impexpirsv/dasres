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
  const tc = await getTranslations("common.countries");
  const ts = await getTranslations("common.specialties");
  const tcat = await getTranslations("common.categories");


  function translateCountry(country: string) {
    const value = country.trim();

    if (tc.has(value)) {
      return tc(value);
    }

    const lower = value.toLowerCase();

    if (tc.has(lower)) {
      return tc(lower);
    }

    return country;
  }


  function translateSpecialty(specialty: string) {
    const value = specialty.trim();

    if (ts.has(value)) {
      return ts(value);
    }

    const lower = value.toLowerCase();

    if (ts.has(lower)) {
      return ts(lower);
    }

    const normalized = lower.replaceAll(" ", "_");

    if (ts.has(normalized)) {
      return ts(normalized);
    }

    return specialty;
  }


  function translateCategory(category: string) {
    const value = category.trim();

    if (tcat.has(value)) {
      return tcat(value);
    }

    const lower = value.toLowerCase();

    if (tcat.has(lower)) {
      return tcat(lower);
    }

    const normalized = lower.replaceAll(" ", "_");

    if (tcat.has(normalized)) {
      return tcat(normalized);
    }

    return category;
  }


  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-2">

      {/* Experts */}

      <div
        className="
          rounded-[2rem]
          border
          border-slate-800
          bg-gradient-to-br
          from-slate-900
          to-slate-950
          p-6
          transition
          hover:border-blue-500/40
        "
      >

        <div className="mb-6 flex items-center justify-between gap-4">

          <h2 className="text-xl font-black text-white">
            🏆 {t("experts.title")}
          </h2>


          <Link
            href="/dashboard/experts"
            className="
              text-sm
              font-semibold
              text-blue-400
              hover:text-blue-300
            "
          >
            {t("viewAll")} →
          </Link>

        </div>


        <div className="space-y-3">

          {topRatedExperts.length === 0 ? (

            <p className="text-slate-500">
              {t("experts.empty")}
            </p>

          ) : (

            topRatedExperts.map((expert) => (

              <Link
                key={expert.id}
                href={`/dashboard/experts/${expert.id}`}
                className="
                  block
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950/70
                  p-4
                  transition-all
                  hover:-translate-y-0.5
                  hover:border-blue-500/50
                "
              >

                <div className="flex justify-between gap-4">

                  <div>

                    <p className="font-bold text-white">
                      {expert.name}
                    </p>


                    <p className="mt-1 text-sm text-slate-400">
                      {translateCountry(expert.country)} ·{" "}
                      {translateSpecialty(expert.specialty)}
                    </p>

                  </div>


                  <div
                    className="
                      whitespace-nowrap
                      font-bold
                      text-yellow-400
                    "
                  >
                    ⭐ {expert.averageRating.toFixed(1)}
                  </div>

                </div>


                <p className="mt-3 text-xs text-slate-500">
                  {t("reviewCount", {
                    count: expert.reviewCount,
                  })}
                </p>


              </Link>

            ))

          )}

        </div>

      </div>



      {/* Companies */}


      <div
        className="
          rounded-[2rem]
          border
          border-slate-800
          bg-gradient-to-br
          from-slate-900
          to-slate-950
          p-6
          transition
          hover:border-emerald-500/40
        "
      >

        <div className="mb-6 flex items-center justify-between gap-4">

          <h2 className="text-xl font-black text-white">
            🏆 {t("companies.title")}
          </h2>


          <Link
            href="/dashboard/companies"
            className="
              text-sm
              font-semibold
              text-blue-400
              hover:text-blue-300
            "
          >
            {t("viewAll")} →
          </Link>

        </div>



        <div className="space-y-3">


          {topRatedCompanies.length === 0 ? (

            <p className="text-slate-500">
              {t("companies.empty")}
            </p>

          ) : (

            topRatedCompanies.map((company) => (

              <Link
                key={company.id}
                href={`/dashboard/companies/${company.id}`}
                className="
                  block
                  rounded-2xl
                  border
                  border-slate-800
                  bg-slate-950/70
                  p-4
                  transition-all
                  hover:-translate-y-0.5
                  hover:border-emerald-500/50
                "
              >

                <div className="flex justify-between gap-4">

                  <div>

                    <p className="font-bold text-white">
                      {company.name}
                    </p>


                    <p className="mt-1 text-sm text-slate-400">
                      {translateCountry(company.country)} ·{" "}
                      {translateCategory(company.category)}
                    </p>

                  </div>


                  <div
                    className="
                      whitespace-nowrap
                      font-bold
                      text-yellow-400
                    "
                  >
                    ⭐ {company.averageRating.toFixed(1)}
                  </div>


                </div>



                <p className="mt-3 text-xs text-slate-500">
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