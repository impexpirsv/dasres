type ProjectTask = {
  id: number;
  status: string;
};

export default function ProjectProgressCard({
  tasks,
}: {
  tasks: ProjectTask[];
}) {
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const percent =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Project Progress
        </h3>

        <span className="text-sm font-semibold text-blue-400">
          {percent}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {completedTasks} of {totalTasks} tasks completed
      </p>
    </div>
  );
}