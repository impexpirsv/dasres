import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import ProjectListProgress from "../../components/project/ProjectListProgress";

function getProjectStatusClass(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "border-yellow-800 bg-yellow-600/20 text-yellow-300";

    case "COMPLETED":
      return "border-emerald-800 bg-emerald-600/20 text-emerald-300";

    case "CANCELLED":
      return "border-red-800 bg-red-600/20 text-red-300";

    default:
      return "border-blue-800 bg-blue-600/20 text-blue-300";
  }
}

export default async function ProjectsPage() {
  const user = await requireUser();

  const t = await getTranslations(
    "dashboardProjects",
  );

  const locale = await getLocale();

  const projects = await prisma.project.findMany({
    where:
      user.role === "admin"
        ? {}
        : {
            OR: [
              {
                createdBy: user.id,
              },
              {
                assignedTo: user.id,
              },
            ],
          },
    include: {
      tasks: {
        select: {
          status: true,
        },
      },
      tradeCase: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

 function getProjectStatusLabel(
  status: string,
) {
  switch (status) {
    case "OPEN":
      return t("statuses.open");

    case "IN_PROGRESS":
      return t("statuses.inProgress");

    case "COMPLETED":
      return t("statuses.completed");

    case "CANCELLED":
      return t("statuses.cancelled");

    case "ACTIVE":
      return t("statuses.active");

    case "PENDING":
      return t("statuses.pending");

    case "REVIEW":
      return t("statuses.review");

    default:
      return status;
  }
}

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10">
        <p className="mb-3 font-semibold text-blue-400">
          {t("eyebrow")}
        </p>

        <h1 className="mb-4 text-5xl font-bold">
          {t("title")}
        </h1>

        <p className="text-slate-400">
          {t("description")}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">
          <div
            aria-hidden="true"
            className="mb-4 text-6xl"
          >
            📁
          </div>

          <h2 className="mb-3 text-2xl font-bold">
            {t("empty.title")}
          </h2>

          <p className="mx-auto max-w-md text-slate-400">
            {t("empty.description")}
          </p>

          <Link
            href="/dashboard/open-cases"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700"
          >
            {t("empty.browseOpenCases")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((project) => {
            const customerName =
              project.tradeCase.customer.name ||
              project.tradeCase.customer.email;

            return (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getProjectStatusClass(
                      project.status,
                    )}`}
                  >
                    {getProjectStatusLabel(
                      project.status,
                    )}
                  </span>

                  <span className="text-xs text-slate-500">
                    {project.createdAt.toLocaleDateString(
                      locale,
                    )}
                  </span>
                </div>

                <h2 className="mb-3 text-2xl font-bold">
                  {project.title}
                </h2>

                <p className="mb-5 line-clamp-2 text-sm text-slate-400">
                  {project.description ||
                    project.tradeCase.description}
                </p>

                <ProjectListProgress
                  tasks={project.tasks}
                />

                <p className="mt-5 text-sm text-slate-500">
                  {t("customer")}:{" "}
                  <span className="text-slate-300">
                    {customerName}
                  </span>
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}