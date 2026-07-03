type ProjectTask = {
  status: string;
};

export default function ProjectListProgress({
  tasks,
}: {
  tasks: ProjectTask[];
}) {
  const total = tasks.length;

  const completed = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const percent =
    total === 0
      ? 0
      : Math.round((completed / total) * 100);

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Progress
        </span>

        <span className="font-medium text-blue-400">
          {percent}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}