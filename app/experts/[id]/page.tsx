import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import DeleteExpertButton from "../../components/DeleteExpertButton";

export default async function ExpertProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="bg-slate-900 rounded-3xl p-10">
          <h1 className="text-5xl font-bold mb-4">
            {expert.name}
          </h1>

          <p className="text-blue-400 text-xl mb-4">
            {expert.specialty}
          </p>

          <p className="text-slate-400 mb-2">
            Country: {expert.country}
          </p>

          <p className="text-slate-400 mb-2">
            Email: {expert.email}
          </p>

          <p className="text-slate-300 text-lg">
            {expert.experience}
          </p>

          <div className="mt-8 inline-block bg-green-600 px-4 py-2 rounded-lg">
            {expert.status}
          </div>

          <div className="mt-8 flex gap-4">
            <Link
              href={`/dashboard/experts/${expert.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
            >
              Edit Expert
            </Link>

            <DeleteExpertButton id={expert.id} />
          </div>
        </div>
      </div>
    </div>
  );
}