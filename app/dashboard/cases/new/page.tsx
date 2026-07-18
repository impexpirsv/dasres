import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";

import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/auth";
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
] as const;

type CreateCaseState = {
  error?: string;
};

async function createCase(
  _previousState: CreateCaseState,
  formData: FormData,
): Promise<CreateCaseState> {
  "use server";

  const user = await requireUser();

  const [t, locale] = await Promise.all([
    getTranslations("createCaseForm"),
    getLocale(),
  ]);

  const numberFormatter =
    new Intl.NumberFormat(locale);

  const caseLimit =
    getCaseLimit(user.planType);

  const activeCasesCount =
    await prisma.tradeCase.count({
      where: {
        customerId: user.id,
        status: {
          in: [
            "OPEN",
            "IN_PROGRESS",
          ],
        },
      },
    });

  if (
    PLAN_LIMITS_ENABLED &&
    user.role !== "admin" &&
    activeCasesCount >= caseLimit
  ) {
    return {
      error: t("errors.planLimit", {
        plan: t(
          `plans.${user.planType.toLowerCase()}`,
        ),
        limit:
          numberFormatter.format(
            caseLimit,
          ),
      }),
    };
  }

  const title = String(
    formData.get("title") || "",
  ).trim();

  const category = String(
    formData.get("category") ||
      "General",
  ).trim();

  const description = String(
    formData.get("description") ||
      "",
  ).trim();

  if (!title || !description) {
    return {
      error: t(
        "errors.titleAndDescriptionRequired",
      ),
    };
  }

  if (
    !CASE_CATEGORIES.includes(
      category as (typeof CASE_CATEGORIES)[number],
    )
  ) {
    return {
      error: t(
        "errors.invalidCategory",
      ),
    };
  }

  await prisma.$transaction(
    async (tx) => {
      const tradeCase =
        await tx.tradeCase.create({
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
            title:
              "Request Submitted",
            completed: true,
            completedAt:
              new Date(),
          },
          {
            caseId: tradeCase.id,
            title:
              "Provider Matching",
          },
          {
            caseId: tradeCase.id,
            title:
              "Documents Review",
          },
          {
            caseId: tradeCase.id,
            title:
              "Service In Progress",
          },
          {
            caseId: tradeCase.id,
            title: "Completed",
          },
        ],
      });
    },
  );

  redirect("/dashboard/cases");
}

export default async function NewCasePage() {
  await requireUser();

  const t = await getTranslations(
    "createCaseForm",
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link
          href="/dashboard/cases"
          className="mb-8 inline-block text-blue-400 hover:underline"
        >
          {t("backToCases")}
        </Link>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="mb-4 text-4xl font-bold">
            {t("pageTitle")}
          </h1>

          <p className="mb-8 text-slate-400">
            {t("pageDescription")}
          </p>

          <CreateCaseForm
            action={createCase}
          />
        </div>
      </div>
    </div>
  );
}