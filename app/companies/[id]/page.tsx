import { prisma } from "../../../lib/prisma";
import DeleteCompanyButton from "../../components/DeleteCompanyButton";
import Link from "next/link";
import type { Metadata } from "next";
import CompanyVerificationButtons from "../../components/CompanyVerificationButtons";
import { requireUser } from "../../../lib/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!company) {
    return {
      title: "Company Not Found",
      description:
        "The requested company profile could not be found.",
    };
  }

  const title = `${company.name} | ${company.category}`;
  const description = `${company.name} is a ${company.category} company from ${company.country}. Discover this company profile on Dasres.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: company.logoUrl
        ? [
            {
              url: company.logoUrl,
              alt: company.name,
            },
          ]
        : ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: company.logoUrl
        ? [company.logoUrl]
        : ["/og-image.png"],
    },
  };
}

export default async function CompanyProfilePage({
  params,
}: Props) {
  const { id } = await params;

  const user = await requireUser();
  const isAdmin = user.role === "admin";

  const company = await prisma.company.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">
          Company Not Found
        </h1>
      </div>
    );
  }

  const companyReviews = company.ownerId
    ? await prisma.review.findMany({
        where: {
          reviewedUserId: company.ownerId,
        },
        orderBy: {
          id: "desc",
        },
      })
    : [];

  const averageRating =
    companyReviews.length > 0
      ? companyReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        ) / companyReviews.length
      : null;

  const canManageCompany =
    isAdmin || company.ownerId === user.id;

  const companySchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    description: company.description,
    url: company.website,
    email: company.email,
    logo: company.logoUrl
      ? company.logoUrl
      : "/og-image.png",
    address: {
      "@type": "PostalAddress",
      addressCountry: company.country,
    },
    industry: company.category,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Status",
        value: company.status,
      },
      {
        "@type": "PropertyValue",
        name: "Category",
        value: company.category,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(companySchema),
        }}
      />

      <div className="max-w-6xl mx-auto px-6 py-20">
        <Link
          href="/dashboard/companies"
          className="text-blue-400 hover:underline mb-8 inline-block"
        >
          ← Back to Companies
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
            {company.logoUrl && (
              <div className="bg-white p-10">
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-72 object-contain"
                />
              </div>
            )}

            <div className="p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-slate-800 px-4 py-2 rounded-full text-sm text-slate-300">
                  Status: {company.status}
                </span>

                <span className="bg-slate-800 px-4 py-2 rounded-full text-sm text-slate-300">
                  {company.country}
                </span>

                {company.verificationStatus === "VERIFIED" && (
                  <span className="bg-emerald-600 px-4 py-2 rounded-full text-sm">
                    ✓ Verified Company
                  </span>
                )}

                {company.verificationStatus === "REJECTED" && (
                  <span className="bg-red-600 px-4 py-2 rounded-full text-sm">
                    Rejected
                  </span>
                )}

                {company.verificationStatus === "PENDING" && (
                  <span className="bg-yellow-600 px-4 py-2 rounded-full text-sm">
                    Pending Verification
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-5xl font-bold">
                  {company.name}
                </h1>

                {company.planType === "GOLD" && (
                  <span className="bg-yellow-600 px-4 py-2 rounded-full text-sm">
                    🥇 GOLD
                  </span>
                )}

                {company.planType === "DIAMOND" && (
                  <span className="bg-cyan-600 px-4 py-2 rounded-full text-sm">
                    💎 DIAMOND
                  </span>
                )}

                {company.planType === "ENTERPRISE" && (
                  <span className="bg-purple-600 px-4 py-2 rounded-full text-sm">
                    👑 ENTERPRISE
                  </span>
                )}
              </div>

              <p className="text-blue-400 text-2xl mb-8">
                {company.category}
              </p>

              <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <p className="text-slate-500 text-sm mb-2">
                  Company Rating
                </p>

                {averageRating ? (
                  <div>
                    <p className="text-3xl font-bold text-yellow-400">
                      ⭐ {averageRating.toFixed(1)} / 5.0
                    </p>

                    <p className="text-slate-400 mt-2">
                      Based on {companyReviews.length} review
                      {companyReviews.length === 1 ? "" : "s"}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500">
                    No reviews yet.
                  </p>
                )}
              </div>

              <div className="border-t border-slate-800 pt-8">
                <h2 className="text-2xl font-bold mb-4">
                  Company Description
                </h2>

                <p className="text-slate-300 text-lg leading-8">
                  {company.description}
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <h2 className="text-2xl font-bold mb-6">
                Company Information
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-500 text-sm">
                    Email
                  </p>
                  <p className="text-slate-200 break-all">
                    {company.email}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">
                    Website
                  </p>
                  <p className="text-slate-200 break-all">
                    {company.website || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">
                    Country
                  </p>
                  <p className="text-slate-200">
                    {company.country}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">
                    Category
                  </p>
                  <p className="text-slate-200">
                    {company.category}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 text-sm">
                    Reputation
                  </p>
                  <p className="text-slate-200">
                    {averageRating
                      ? `⭐ ${averageRating.toFixed(1)} (${companyReviews.length} reviews)`
                      : "No reviews yet"}
                  </p>
                </div>
              </div>

              <a
                href={`mailto:${company.email}`}
                className="mt-6 block text-center bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
              >
                Send Email
              </a>

              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl"
                >
                  Visit Website
                </a>
              )}
            </div>

            {canManageCompany && (
              <div className="flex flex-col gap-3">
                {isAdmin && (
                  <div className="bg-slate-800 rounded-xl p-4">
                    <p className="text-slate-500 text-sm mb-2">
                      Verification Status
                    </p>

                    <p className="text-slate-200 font-semibold mb-4">
                      {company.verificationStatus}
                    </p>

                    <CompanyVerificationButtons
                      companyId={company.id}
                    />
                  </div>
                )}

                <Link
                  href={`/dashboard/companies/${company.id}/edit`}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-center"
                >
                  Edit Company
                </Link>

                <DeleteCompanyButton id={company.id} />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}