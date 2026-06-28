import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import DeleteOpportunityButton from "../../components/DeleteOpportunityButton";
import type { Metadata } from "next";
import { requireUser } from "../../../lib/auth";
import { formatCountry } from "../../../lib/format";
import Navbar from "../../components/Navbar";
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
      <span className="rounded-full bg-red-600 px-4 py-2 text-sm">Closed</span>
    );
  }

  return (
    <span className="rounded-full bg-slate-700 px-4 py-2 text-sm">
      {status}
    </span>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const opportunity = await prisma.opportunity.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!opportunity) {
    return {
      title: "Opportunity Not Found",
      description: "The requested opportunity could not be found.",
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
      images: opportunity.imageUrl ? [opportunity.imageUrl] : ["/og-image.png"],
    },
  };
}

export default async function OpportunityProfilePage({ params }: Props) {
  const { id } = await params;

  const user = await requireUser();
  const isAdmin = user.role === "admin";

  const opportunity = await prisma.opportunity.findUnique({
    where: {
      id: Number(id),
    },
  });
  const relatedCompanies = await prisma.company.findMany({
    where: {
      verificationStatus: "VERIFIED",
      country: opportunity?.country,
    },
    take: 3,
    orderBy: {
      verifiedAt: "desc",
    },
  });
  const relatedExperts = opportunity
    ? await prisma.expert.findMany({
        where: {
          verificationStatus: "VERIFIED",
          country: opportunity.country,
        },
        take: 3,
        orderBy: {
          verifiedAt: "desc",
        },
      })
    : [];
  if (!opportunity) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">Opportunity Not Found</h1>
      </div>
    );
  }

  const opportunitySchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opportunity.title,
    description: opportunity.description,
    image: opportunity.imageUrl ? opportunity.imageUrl : "/og-image.png",
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
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(opportunitySchema),
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-20">
        <Link
          href="/opportunities"
          className="text-blue-400 hover:underline mb-8 inline-block"
        >
          ← Back to Opportunities
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
            {opportunity.imageUrl ? (
              <img
                src={opportunity.imageUrl}
                alt={opportunity.title}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="h-96 bg-slate-800 flex items-center justify-center text-7xl">
                🌍
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

              <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
                {opportunity.title}
              </h1>

              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-slate-500 text-sm">Status</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-2">
                    {opportunity.status}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-slate-500 text-sm">Country</p>
                  <p className="text-2xl font-bold text-blue-400 mt-2">
                    {formatCountry(opportunity.country)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-slate-500 text-sm">Visibility</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-2">
                    Public
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-slate-500 text-sm">Platform</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-2">
                    Dasres
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-slate-500 text-sm">Category</p>
                  <p className="text-xl font-bold text-purple-400 mt-2">
                    Trade
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-slate-500 text-sm">Trust</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-2">
                    Verified
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-8">
                <h2 className="text-2xl font-bold mb-4">
                  Opportunity Description
                </h2>

                <p className="text-slate-300 text-lg leading-8">
                  {opportunity.description}
                </p>
              </div>

              <div className="border-t border-slate-800 pt-8 mt-8">
                <h2 className="text-2xl font-bold mb-4">How to respond</h2>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-blue-400 font-bold mb-2">1. Review</p>

                    <p className="text-slate-400">
                      Read the full opportunity requirements.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-blue-400 font-bold mb-2">2. Contact</p>

                    <p className="text-slate-400">
                      Reach out through Dasres or email.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-blue-400 font-bold mb-2">
                      3. Collaborate
                    </p>

                    <p className="text-slate-400">
                      Build a trusted trade partnership.
                    </p>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="border-t border-slate-800 pt-8 mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/dashboard/opportunities/${opportunity.id}/edit`}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
                  >
                    Edit Opportunity
                  </Link>

                  <DeleteOpportunityButton id={opportunity.id} />
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-6">Opportunity Summary</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-500 text-sm">Country</p>

                  <p className="text-slate-200">
                    {formatCountry(opportunity.country)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">Status</p>

                  <p className="text-slate-200">{opportunity.status}</p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">Type</p>

                  <p className="text-slate-200">Trade Opportunity</p>
                </div>
              </div>

              <Link
                href="/dashboard/cases/new"
                className="mt-6 block text-center bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
              >
                Open Trade Case
              </Link>

              <Link
                href="/companies"
                className="mt-3 block text-center bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl"
              >
                Find Companies
              </Link>

              <Link
                href="/experts"
                className="mt-3 block text-center bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl"
              >
                Find Experts
              </Link>
            </div>
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">Related Companies</h2>

              {relatedCompanies.length === 0 ? (
                <p className="text-slate-500">
                  No verified companies found for this country yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {relatedCompanies.map((company) => (
                    <Link
                      key={company.id}
                      href={`/companies/${company.id}`}
                      className="block rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-blue-500 transition"
                    >
                      <p className="font-semibold">{company.name}</p>

                      <p className="text-sm text-slate-400 mt-1">
                        {company.category}
                      </p>

                      <p className="text-xs text-emerald-400 mt-2">
                        ✓ Verified
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">Related Experts</h2>

              {relatedExperts.length === 0 ? (
                <p className="text-slate-500">
                  No verified experts found for this country yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {relatedExperts.map((expert) => (
                    <Link
                      key={expert.id}
                      href={`/experts/${expert.id}`}
                      className="block rounded-2xl border border-slate-800 bg-slate-950 p-4 hover:border-cyan-500 transition"
                    >
                      <p className="font-semibold">{expert.name}</p>

                      <p className="text-sm text-slate-400 mt-1">
                        {expert.specialty}
                      </p>

                      <p className="text-xs text-emerald-400 mt-2">
                        ✓ Verified
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-4">Trust Notice</h2>

              <p className="text-slate-400 leading-7">
                Always verify trade details, documents and service providers
                before starting any international transaction.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
