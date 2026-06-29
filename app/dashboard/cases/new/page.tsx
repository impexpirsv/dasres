import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCaseLimit } from "../../../../lib/plans";
import CreateCaseForm from "../../../components/CreateCaseForm";

const PLAN_LIMITS_ENABLED = true;

const CASE_CATEGORIES = [
  "General",
  "Customs Clearance",
  "Shipping",
  "Inspection",
  "Insurance",
  "Sourcing",
  "Documentation",
  "Payment",
];

type CreateCaseState = {
  error?: string;
};

async function createCase(
  previousState: CreateCaseState,
  formData: FormData
): Promise<CreateCaseState> {
  "use server";

  const user = await requireUser();

  const caseLimit = getCaseLimit(user.planType);

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
    return {
      error: `Your ${user.planType} plan allows up to ${caseLimit} active trade cases. Upgrade your plan to create more cases.`,
    };
  }

  const title = String(formData.get("title") || "").trim();
  const category = String(
    formData.get("category") || "General"
  ).trim();
  const description = String(
    formData.get("description") || ""
  ).trim();

  if (!title || !description) {
    return {
      error: "Title and description are required.",
    };
  }

  if (!CASE_CATEGORIES.includes(category)) {
    return {
      error: "Invalid case category.",
    };
  }

 await prisma.$transaction(async (tx) => {
  const tradeCase = await tx.tradeCase.create({
    data: {
      title,
      category,
      description,
      customerId: user.id,
      status: "OPEN",
    },
  });

  await tx.caseStep.createMany({
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

          <CreateCaseForm action={createCase} />
        </div>
      </div>
    </div>
  );
}