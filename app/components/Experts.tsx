import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../lib/prisma";
import type { Locale } from "../../lib/locale";

const getHomepageExperts = unstable_cache(
  async () => {
    return prisma.expert.findMany({
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
  ["homepage-experts"],
  {
    revalidate: 300,
    tags: ["homepage-experts"],
  },
);


export default async function Experts({ locale, localized }: { locale: Locale; localized: boolean }) {
  const expertsPath = localized ? `/${locale}/experts` : "/experts";
  const t = await getTranslations(
    "expertsSection",
  );

  const tc = await getTranslations(
    "common.countries",
  );

  const ts = await getTranslations(
    "common.specialties",
  );


  function translateCountry(
    country: string,
  ) {
    if (tc.has(country)) {
      return tc(country);
    }

    const key = country.toLowerCase();

    return tc.has(key)
      ? tc(key)
      : country;
  }


  function translateSpecialty(
    specialty: string,
  ) {
    if (ts.has(specialty)) {
      return ts(specialty);
    }

    const key = specialty
      .toLowerCase()
      .replaceAll(" ", "_");

    return ts.has(key)
      ? ts(key)
      : specialty;
  }


  const experts =
    await getHomepageExperts();


  return (
    <section
      className="
        relative
        overflow-hidden
        border-y
        border-slate-800
        bg-slate-950
        py-28
      "
    >

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.12),transparent_35%)]
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
              <span className="h-2 w-2 rounded-full bg-cyan-400" />

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
            href={expertsPath}
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
            {t("viewAll")} →
          </Link>


        </div>




        {experts.length === 0 ? (

          <div
            className="
              rounded-3xl
              border
              border-slate-800
              bg-slate-900
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

            {experts.map((expert) => (

              <div
                key={expert.id}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-[2rem]
                  border
                  border-slate-800
                  bg-slate-900/80
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
                      items-center
                      justify-between
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
                        from-blue-600
                        via-cyan-500
                        to-emerald-400
                        text-3xl
                        shadow-lg
                        shadow-cyan-500/20
                      "
                    >
                      👨‍💼
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
                    {expert.name}
                  </h3>



                  <p className="mt-2 text-cyan-400">
                    {translateSpecialty(
                      expert.specialty,
                    )}
                  </p>



                  <p className="mt-2 text-slate-500">
                    {translateCountry(
                      expert.country,
                    )}
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
                      ● {t("available")}
                    </span>



                    <Link
                      href={`${expertsPath}/${expert.id}`}
                      className="
                        font-bold
                        text-blue-400
                        transition
                        hover:text-cyan-300
                      "
                    >
                      {t("viewProfile")} →
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
