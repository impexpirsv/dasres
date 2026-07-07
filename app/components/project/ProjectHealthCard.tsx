type Task = {
  status: string;
  estimatedHours: number | null;
  loggedHours: number | null;
  dueDate: Date | null;
};

export default function ProjectHealthCard({
  tasks,
}: {
  tasks: Task[];
}) {
  const completed = tasks.filter(
    (t) => t.status === "COMPLETED",
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completed / tasks.length) * 100);

  const estimated = tasks.reduce(
    (sum, t) => sum + (t.estimatedHours ?? 0),
    0,
  );

  const logged = tasks.reduce(
    (sum, t) => sum + (t.loggedHours ?? 0),
    0,
  );

  const overdue = tasks.filter((t) => {
    if (!t.dueDate) return false;

    return (
      t.status !== "COMPLETED" &&
      new Date(t.dueDate) < new Date()
    );
  }).length;

  const utilization =
    estimated === 0
      ? 0
      : Math.round((logged / estimated) * 100);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="text-lg font-bold text-white">
        Project Health
      </h3>

      <div className="mt-6 space-y-5">

        <Metric
          label="Progress"
          value={`${progress}%`}
          color="bg-blue-500"
        />

        <Metric
          label="Hours Used"
          value={`${logged}/${estimated}`}
          color="bg-green-500"
        />

        <Metric
          label="Utilization"
          value={`${utilization}%`}
          color="bg-amber-500"
        />

        <Metric
          label="Overdue"
          value={String(overdue)}
          color="bg-red-500"
        />

      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-400">
          {label}
        </span>

        <span className="font-bold text-white">
          {value}
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width:
              label === "Overdue"
                ? "100%"
                : value,
          }}
        />
      </div>
    </div>
  );
}