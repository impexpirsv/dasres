import ProjectProgressCard from "./ProjectProgressCard";
import StatCard from "../StatCard";

type ProjectTask = {
  id: number;
  status: string;
};

export default function ProjectOverviewCards({
  customer,
  category,
  completedSteps,
  totalSteps,
  tasks,
}: {
  customer: string;
  category: string;
  completedSteps: number;
  totalSteps: number;
  tasks: ProjectTask[];
}) {
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const openTasks = totalTasks - completedTasks;

  return (
    <section className="space-y-6">
      <ProjectProgressCard tasks={tasks} />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Customer
          </p>

          <p className="mt-3 break-words text-2xl font-bold leading-tight text-white">
            {customer}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category
          </p>

          <p className="mt-3 break-words text-2xl font-bold leading-tight text-white">
            {category}
          </p>
        </div>

        <StatCard
          title="Open Tasks"
          value={openTasks}
          color="yellow"
        />

        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          color="green"
        />

        <StatCard
          title="Steps"
          value={`${completedSteps} / ${totalSteps}`}
          subtitle="Completed"
        />
      </div>
    </section>
  );
}