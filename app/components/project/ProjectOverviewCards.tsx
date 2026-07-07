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
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-500">Customer</p>
          <p className="mt-2 text-xl font-bold">{customer}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-500">Category</p>
          <p className="mt-2 text-xl font-bold">{category}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-500">Open Tasks</p>
          <p className="mt-2 text-4xl font-bold text-yellow-400">
            {openTasks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-500">Completed Tasks</p>
          <p className="mt-2 text-4xl font-bold text-green-400">
            {completedTasks}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-500">Steps</p>
          <p className="mt-2 text-xl font-bold">
            {completedSteps} / {totalSteps}
          </p>
          <p className="mt-1 text-xs text-slate-500">Completed</p>
        </div>
      </div>
    </section>
  );
}