import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";

import { prisma } from "../../lib/prisma";
import type { Locale } from "../../lib/locale";


const getHomepageCompanies = unstable_cache(
  async () => {
    return prisma.company.findMany({
      take: 6,
      where: {
        verificationStatus: "VERIFIED",
      },
      orderBy: [
        {
          verifiedAt: "desc",
        },
        {
          id: "desc",
        },
      ],
    });
  },
  ["homepage-companies"],
  {
    revalidate: 300,
    tags: ["homepage-companies"],
  },
);



export default async function Companies({ localized = false, locale }: { localized?: boolean; locale?: Locale }) {
  const t = await getTranslations(
    "companiesSection",
  );

const tc = await getTranslations("common.countries");
const tcat = await getTranslations("common.categories");
  const companies =
    await getHomepageCompanies();
  const companiesPath = localized && locale ? `/${locale}/companies` : "/companies";



  return (
    <section
      className="
        relative
        overflow-hidden
        border-y
        border-slate-800
        bg-slate-900
        py-28
      "
    >

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_35%)]
        "
      />



      <div className="relative mx-auto max-w-7xl px-6">


        <div
          className="
            mb-12
            flex
            flex-col
            gap-6
            md:flex-row
            md:items-end
            md:justify-between
          "
        >

          <div>


            <div
              className="
                mb-5
                inline-flex
                items-center
                gap-3
                rounded-full
                border
                border-cyan-500/30
                bg-cyan-500/10
                px-5
                py-2
                text-sm
                font-bold
                text-cyan-300
              "
            >

              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-cyan-400
                "
              />

              {t("eyebrow")}

            </div>



            <h2
              className="
                mb-4
                text-4xl
                font-black
                md:text-6xl
              "
            >
              {t("title")}
            </h2>



            <p
              className="
                max-w-2xl
                text-lg
                leading-8
                text-slate-400
              "
            >
              {t("description")}
            </p>


          </div>




          <Link
            href={companiesPath}
            className="
              rounded-xl
              border
              border-cyan-500/40
              bg-cyan-500/10
              px-6
              py-3
              font-bold
              text-cyan-300
              transition
              hover:bg-cyan-600
              hover:text-white
            "
          >
            {t("viewAll")}
            {" "}
            <span aria-hidden="true">
              →
            </span>
          </Link>


        </div>





        {companies.length === 0 ? (

          <div
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-950
              p-8
              text-center
              text-slate-400
            "
          >
            {t("empty")}
          </div>

        ) : (



          <div
            className="
              grid
              gap-7
              md:grid-cols-2
              xl:grid-cols-3
            "
          >

            {companies.map((company) => (

              <div
                key={company.id}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-[2rem]
                  border
                  border-slate-800
                  bg-slate-950/80
                  p-7
                  transition-all
                  duration-300
                  hover:-translate-y-2
                  hover:border-cyan-500/60
                  hover:shadow-2xl
                  hover:shadow-cyan-500/10
                "
              >


                <div
                  className="
                    absolute
                    end-0
                    top-0
                    h-32
                    w-32
                    rounded-full
                    bg-cyan-500/10
                    blur-3xl
                    transition
                    group-hover:bg-cyan-500/20
                  "
                />



                <div className="relative">


                  <div
                    className="
                      mb-6
                      flex
                      items-start
                      justify-between
                      gap-4
                    "
                  >


                    <div
                      className="
                        flex
                        h-16
                        w-16
                        items-center
                        justify-center
                        rounded-2xl
                        bg-gradient-to-br
                        from-cyan-600
                        to-emerald-500
                        text-3xl
                        shadow-lg
                        shadow-cyan-500/20
                      "
                    >
                      🏢
                    </div>




                    <span
                      className="
                        rounded-full
                        border
                        border-emerald-500/30
                        bg-emerald-500/10
                        px-3
                        py-1
                        text-xs
                        font-bold
                        text-emerald-300
                      "
                    >
                      ✓ {t("verified")}
                    </span>


                  </div>




                  <h3
                    className="
                      text-2xl
                      font-black
                    "
                  >
                    {company.name}
                  </h3>




                <p className="mt-2 text-cyan-400">
  {tcat.has(company.category)
    ? tcat(company.category)
    : company.category}
</p>



                 <p className="mt-2 text-slate-500">
  {tc.has(company.country)
    ? tc(company.country)
    : company.country}
</p>



                  <p
                    className="
                      mt-4
                      line-clamp-2
                      leading-7
                      text-slate-400
                    "
                  >
                    {company.description}
                  </p>





                  <div
                    className="
                      mt-7
                      flex
                      items-center
                      justify-between
                      border-t
                      border-slate-800
                      pt-5
                    "
                  >


                    <span
                      className="
                        text-sm
                        font-bold
                        text-emerald-400
                      "
                    >
                      ● {t("acceptingProjects")}
                    </span>



                    <Link
                      href={`${companiesPath}/${company.id}`}
                      className="
                        font-bold
                        text-cyan-400
                        transition
                        hover:text-cyan-300
                      "
                    >
                      {t("viewProfile")}
                      {" "}
                      <span aria-hidden="true">
                        →
                      </span>
                    </Link>


                  </div>


                </div>


              </div>

            ))}

          </div>

        )}


      </div>


    </section>
  );
}
