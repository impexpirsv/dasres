import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import DeleteExpertButton from "../../components/DeleteExpertButton";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
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
      images: expert.imageUrl
        ? [expert.imageUrl]
        : ["/og-image.png"],
    },
  };
}

export default async function ExpertProfilePage({
  params,
}: Props) {
  const { id } = await params;

  const expert = await prisma.expert.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!expert) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">
          Expert Not Found
        </h1>
      </div>
    );
  }

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
            href="/experts"
            className="text-blue-400 hover:underline mb-8 inline-block"
          >
            ← Back to Experts
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
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

                <h1 className="text-5xl font-bold mb-4">
                  {expert.name}
                </h1>

                <p className="text-blue-400 text-2xl mb-8">
                  {expert.specialty}
                </p>

                <div className="border-t border-slate-800 pt-8">
                  <h2 className="text-2xl font-bold mb-4">
                    Experience
                  </h2>

                  <p className="text-slate-300 text-lg leading-8">
                    {expert.experience}
                  </p>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
                <h2 className="text-2xl font-bold mb-6">
                  Contact Expert
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-slate-500 text-sm">
                      Email
                    </p>
                    <p className="text-slate-200 break-all">
                      {expert.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm">
                      Country
                    </p>
                    <p className="text-slate-200">
                      {expert.country}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 text-sm">
                      Specialty
                    </p>
                    <p className="text-slate-200">
                      {expert.specialty}
                    </p>
                  </div>
                </div>

                <a
                  href={`mailto:${expert.email}`}
                  className="mt-6 block text-center bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
                >
                  Send Email
                </a>
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
                <h2 className="text-2xl font-bold mb-4">
                  Admin Actions
                </h2>

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
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}