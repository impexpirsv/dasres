import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getBestPlan,
  getCaseLimit,
} from "../../../../lib/plans";
const PLAN_LIMITS_ENABLED = false;
async function createCase(formData: FormData) {
  "use server";

  const user = await requireUser();
  const ownedCompanies =
    await prisma.company.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        planType: true,
      },
    });

  const bestPlan = getBestPlan(
    ownedCompanies.map((company) => company.planType)
  );

  const caseLimit = getCaseLimit(bestPlan);

  const activeCasesCount =
    await prisma.tradeCase.count({
      where: {
        customerId: user.id,
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },
    });

  if (
  PLAN_LIMITS_ENABLED &&
  user.role !== "admin" &&
  activeCasesCount >= caseLimit
) {
  throw new Error(
    `Your ${bestPlan} plan allows up to ${caseLimit} active trade cases.`
  );
}

  const title = String(formData.get("title") || "");
  const description = String(
    formData.get("description") || ""
  );

  if (!title || !description) {
    throw new Error("Title and description are required");
  }

  const tradeCase = await prisma.tradeCase.create({
    data: {
      title,
      description,
      customerId: user.id,
      status: "OPEN",
    },
  });

  await prisma.caseStep.createMany({
    data: [
      {
        caseId: tradeCase.id,
        title: "Request Submitted",
        completed: true,
        completedAt: new Date(),
      },
      {
        caseId: tradeCase.id,
        title: "Provider Matching",
      },
      {
        caseId: tradeCase.id,
        title: "Documents Review",
      },
      {
        caseId: tradeCase.id,
        title: "Service In Progress",
      },
      {
        caseId: tradeCase.id,
        title: "Completed",
      },
    ],
  });

  redirect(`/dashboard/cases`);
}

export default async function NewCasePage() {
  await requireUser();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link
          href="/dashboard/cases"
          className="text-blue-400 hover:underline mb-8 inline-block"
        >
          ← Back to Cases
        </Link>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
          <h1 className="text-4xl font-bold mb-4">
            Create New Trade Case
          </h1>

          <p className="text-slate-400 mb-8">
            Submit a new trade service request. A provider or expert can be assigned later.
          </p>

          <form action={createCase} className="space-y-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Case Title
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="Need customs clearance in Dubai"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Description
              </label>
              <textarea
                name="description"
                required
                rows={7}
                placeholder="Describe the shipment, service needed, country, documents, timeline, and any special requirements..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
            >
              Create Case
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}