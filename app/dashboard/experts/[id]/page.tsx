import Link from "next/link";
import { prisma } from "../../../../lib/prisma";
import DeleteExpertButton from "../../../components/DeleteExpertButton";
import type { Metadata } from "next";
import { calculateTrustScore } from "../../../../lib/ranking";
import { requireUser } from "../../../../lib/auth";
type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const expert = await prisma.expert.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!expert) {
    return {
      title: "Expert Not Found",
      description: "The requested expert profile could not be found.",
    };
  }
 
  const title = `${expert.name} | ${expert.specialty}`;
  const description = `${expert.name} is an expert in ${expert.specialty} from ${expert.country}. Discover this expert profile on Dasres.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: expert.imageUrl
        ? [
            {
              url: expert.imageUrl,
              alt: expert.name,
            },
          ]
        : ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: expert.imageUrl ? [expert.imageUrl] : ["/og-image.png"],
    },
  };
}

function getPremiumBorder(planType: string) {
  if (planType === "GOLD") {
    return "border-yellow-500 shadow-lg shadow-yellow-500/10";
  }

  if (planType === "DIAMOND") {
    return "border-cyan-500 shadow-lg shadow-cyan-500/10";
  }

  if (planType === "ENTERPRISE") {
    return "border-purple-500 shadow-lg shadow-purple-500/10";
  }

  return "border-slate-800";
}

function PlanBadge({ planType }: { planType: string }) {
  if (planType === "GOLD") {
    return (
      <span className="bg-yellow-600 px-4 py-2 rounded-full text-sm">
        🥇 GOLD
      </span>
    );
  }

  if (planType === "DIAMOND") {
    return (
      <span className="bg-cyan-600 px-4 py-2 rounded-full text-sm">
        💎 DIAMOND
      </span>
    );
  }

  if (planType === "ENTERPRISE") {
    return (
      <span className="bg-purple-600 px-4 py-2 rounded-full text-sm">
        👑 ENTERPRISE
      </span>
    );
  }

  return null;
}

export default async function ExpertProfilePage({ params }: Props) {
  const { id } = await params;

  const expert = await prisma.expert.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!expert) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">Expert Not Found</h1>
      </div>
    );
  }
 const user = await requireUser();

  const isAdmin = user.role === "admin";

  const canManageExpert = isAdmin || expert.ownerId === user.id;
  const reviews = expert.ownerId
    ? await prisma.review.findMany({
        where: {
          reviewedUserId: expert.ownerId,
        },
        include: {
          reviewer: true,
        },
        orderBy: {
          id: "desc",
        },
      })
    : [];

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
  const completedCases = expert.ownerId
    ? await prisma.tradeCase.count({
        where: {
          status: "COMPLETED",
          proposals: {
            some: {
              status: "ACCEPTED",
              expert: {
                ownerId: expert.ownerId,
              },
            },
          },
        },
      })
    : 0;

  const trustScore = calculateTrustScore({
    averageRating,
    completedCases,
    verificationStatus: expert.verificationStatus,
    planType: expert.planType,
  });
  const premiumBorder = getPremiumBorder(expert.planType);

  const expertSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: expert.name,
    jobTitle: expert.specialty,
    email: expert.email,
    image: expert.imageUrl || undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: expert.country,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(expertSchema),
        }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <Link
            href="/dashboard/experts"
            className="text-blue-400 hover:underline mb-8 inline-block"
          >
            ← Back to Experts
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div
              className={`lg:col-span-2 bg-slate-900 rounded-3xl border overflow-hidden ${premiumBorder}`}
            >
              {expert.imageUrl && (
                <img
                  src={expert.imageUrl}
                  alt={expert.name}
                  className="w-full h-80 object-cover"
                />
              )}

              <div className="p-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-green-600 px-4 py-2 rounded-full text-sm">
                    {expert.status}
                  </span>

                  <span className="bg-slate-800 px-4 py-2 rounded-full text-sm text-slate-300">
                    {expert.country}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h1 className="text-5xl font-bold">{expert.name}</h1>

                  <PlanBadge planType={expert.planType} />
                </div>

                <p className="text-blue-400 text-2xl mb-4">
                  {expert.specialty}
                </p>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-slate-500 text-sm mb-1">Trust Score</p>

                  <p className="text-2xl font-bold text-emerald-400">
                    {trustScore}/100
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-slate-500 text-sm mb-1">Rating</p>

                    <p className="text-2xl font-bold text-yellow-400">
                      {reviews.length > 0
                        ? `⭐ ${averageRating.toFixed(1)}`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-slate-500 text-sm mb-1">Reviews</p>

                    <p className="text-2xl font-bold text-slate-200">
                      {reviews.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-slate-500 text-sm mb-1">Specialty</p>

                    <p className="text-xl font-bold text-blue-400">
                      {expert.specialty}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-slate-500 text-sm mb-1">Country</p>

                    <p className="text-2xl font-bold text-blue-400">
                      {expert.country}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-8">
                  <h2 className="text-2xl font-bold mb-4">Experience</h2>

                  <p className="text-slate-300 text-lg leading-8">
                    {expert.experience}
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-8 mt-8">
                  <h2 className="text-2xl font-bold mb-4">Recent Reviews</h2>

                  {reviews.length === 0 ? (
                    <p className="text-slate-500">No reviews yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.slice(0, 3).map((review) => (
                        <div
                          key={review.id}
                          className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                        >
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <p className="font-semibold">
                              {review.reviewer?.name ||
                                review.reviewer?.email ||
                                "User"}
                            </p>

                            <p className="text-yellow-400">
                              ⭐ {review.rating}/5
                            </p>
                          </div>

                          <p className="text-slate-300 leading-7">
                            {review.comment || "No comment provided."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div
                className={`bg-slate-900 rounded-3xl border p-6 ${premiumBorder}`}
              >
                <h2 className="text-2xl font-bold mb-6">Contact Expert</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-slate-500 text-sm">Email</p>
                    <p className="text-slate-200 break-all">{expert.email}</p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm">Country</p>
                    <p className="text-slate-200">{expert.country}</p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm">Specialty</p>
                    <p className="text-slate-200">{expert.specialty}</p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm">Reputation</p>
                    <p className="text-slate-200">
                      {reviews.length > 0
                        ? `⭐ ${averageRating.toFixed(1)} (${reviews.length} reviews)`
                        : "No reviews yet"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Trust Score</p>

                    <p className="text-emerald-400 font-semibold">
                      {trustScore}/100
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm">Completed Cases</p>

                    <p className="text-slate-200">{completedCases}</p>
                  </div>
                </div>

                <a
                  href={`mailto:${expert.email}`}
                  className="mt-6 block text-center bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
                >
                  Send Email
                </a>
              </div>
              {canManageExpert && (
                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
                  <h2 className="text-2xl font-bold mb-4">Admin Actions</h2>

                  <div className="flex flex-col gap-3">
                    <Link
                      href={`/dashboard/experts/${expert.id}/edit`}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl text-center"
                    >
                      Edit Expert
                    </Link>

                    <DeleteExpertButton id={expert.id} />
                  </div>
                </div>
              )}
            </aside>
          </div>

          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-400">
            Reviews can only be submitted after a completed trade case.
          </div>
        </div>
      </div>
    </>
  );
}
