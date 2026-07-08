import ProjectProgressCard from "./ProjectProgressCard";

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
          <p className="mt-2 text-2xl font-bold text-white">{customer}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{category}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Open Tasks
          </p>
          <p className="mt-2 text-5xl font-black text-yellow-400">
            {openTasks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Completed Tasks
          </p>
          <p className="mt-2 text-5xl font-black text-green-400">
            {completedTasks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Steps
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {completedSteps} / {totalSteps}
          </p>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
            Completed
          </p>
        </div>
      </div>
    </section>
  );
}
