import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function ProjectsPage() {
  const user = await requireUser();

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="mb-10">
        <p className="text-blue-400 font-semibold mb-3">Projects</p>

        <h1 className="text-5xl font-bold mb-4">Trade Projects</h1>

        <p className="text-slate-400">
          Manage accepted trade cases and track execution progress.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
          <div className="text-6xl mb-4">📁</div>

          <h2 className="text-2xl font-bold mb-3">No Projects Yet</h2>

          <p className="text-slate-400 max-w-md mx-auto">
            Projects are created automatically when a proposal is accepted.
          </p>

          <Link
            href="/dashboard/open-cases"
            className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
          >
            Browse Open Cases
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500 transition"
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="bg-blue-600/20 text-blue-300 border border-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                  {project.status}
                </span>

                <span className="text-slate-500 text-xs">
                  {project.createdAt.toLocaleDateString()}
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-3">{project.title}</h2>

              <p className="text-slate-400 text-sm line-clamp-2 mb-5">
                {project.description || project.tradeCase.description}
              </p>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-white font-semibold">
                    {project.progress}%
                  </span>
                </div>

                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${project.progress}%`,
                    }}
                  />
                </div>
              </div>

              <p className="text-sm text-slate-500">
                Customer:{" "}
                <span className="text-slate-300">
                  {project.tradeCase.customer.name ||
                    project.tradeCase.customer.email}
                </span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}