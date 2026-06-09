import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import DeleteOpportunityButton from "../../components/DeleteOpportunityButton";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;

  const opportunity =
    await prisma.opportunity.findUnique({
      where: {
        id: Number(id),
      },
    });

  if (!opportunity) {
    return {
      title: "Opportunity Not Found",
      description:
        "The requested opportunity could not be found.",
    };
  }

  const title = `${opportunity.title} | Dasres`;

  const description =
    opportunity.description.length > 160
      ? `${opportunity.description.slice(0, 157)}...`
      : opportunity.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: opportunity.imageUrl
        ? [
            {
              url: opportunity.imageUrl,
              alt: opportunity.title,
            },
          ]
        : ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: opportunity.imageUrl
        ? [opportunity.imageUrl]
        : ["/og-image.png"],
    },
  };
}

export default async function OpportunityProfilePage({
  params,
}: Props) {
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

  const opportunitySchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opportunity.title,
    description: opportunity.description,
    image: opportunity.imageUrl
      ? opportunity.imageUrl
      : "/og-image.png",
    author: {
      "@type": "Organization",
      name: "Dasres",
    },
    publisher: {
      "@type": "Organization",
      name: "Dasres",
      logo: {
        "@type": "ImageObject",
        url: "/og-image.png",
      },
    },
    about: {
      "@type": "Thing",
      name: opportunity.status,
    },
    contentLocation: {
      "@type": "Country",
      name: opportunity.country,
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(opportunitySchema),
        }}
      />

      <div className="max-w-5xl mx-auto px-6 py-20">
        <Link
          href="/opportunities"
          className="text-blue-400 hover:underline mb-8 inline-block"
        >
          ← Back to Opportunities
        </Link>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
          {opportunity.imageUrl && (
            <img
              src={opportunity.imageUrl}
              alt={opportunity.title}
              className="w-full h-80 object-cover"
            />
          )}

          <div className="p-10">
            <h1 className="text-5xl font-bold mb-4">
              {opportunity.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="bg-green-600 px-4 py-2 rounded-full text-sm">
                {opportunity.status}
              </span>

              <span className="bg-slate-800 px-4 py-2 rounded-full text-sm text-slate-300">
                {opportunity.country}
              </span>
            </div>

            <div className="border-t border-slate-800 pt-8">
              <h2 className="text-2xl font-bold mb-4">
                Opportunity Description
              </h2>

              <p className="text-slate-300 text-lg leading-8">
                {opportunity.description}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/opportunities/${opportunity.id}/edit`}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
              >
                Edit Opportunity
              </Link>

              <DeleteOpportunityButton id={opportunity.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}