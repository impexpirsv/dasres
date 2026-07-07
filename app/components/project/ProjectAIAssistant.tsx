type Task = {
  id: number;
  title: string;
  status: string;
  progress?: number | null;
  dueDate: Date | null;
  estimatedHours: number | null;
  loggedHours: number | null;
  dependsOn?: {
    id: number;
    status?: string;
  } | null;
};

export default function ProjectAIAssistant({
  tasks,
}: {
  tasks: Task[];
}) {
  const today = new Date();

  const completed = tasks.filter(
    (t) => t.status === "COMPLETED",
  ).length;

  const overdue = tasks.filter((t) => {
    if (!t.dueDate) return false;

    return (
      t.status !== "COMPLETED" &&
      new Date(t.dueDate) < today
    );
  }).length;

  const blocked = tasks.filter(
    (t) =>
      t.dependsOn &&
      t.dependsOn.status !== "COMPLETED" &&
      t.status !== "COMPLETED",
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completed / tasks.length) * 100);

  let risk = "Low";
  let riskColor = "text-green-300";

  if (blocked > 0 || overdue > 0) {
    risk = "Medium";
    riskColor = "text-amber-300";
  }

  if (blocked > 2 || overdue > 2) {
    risk = "High";
    riskColor = "text-red-300";
  }

  const suggestions: string[] = [];

  if (blocked > 0)
    suggestions.push("Resolve blocked tasks.");

  if (overdue > 0)
    suggestions.push("Review overdue tasks.");

  if (progress < 40)
    suggestions.push("Increase execution pace.");

  if (suggestions.length === 0)
    suggestions.push("Project is progressing normally.");

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-900">
      <div className="border-b border-slate-800 p-5">
        <h3 className="text-lg font-bold text-white">
          🤖 Dasres AI
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Smart Project Analysis
        </p>
      </div>

      <div className="space-y-5 p-5">

        <div className="rounded-2xl bg-slate-950 p-4">
          <p className="text-xs uppercase text-slate-500">
            Risk
          </p>

          <p className={`mt-2 text-2xl font-black ${riskColor}`}>
            {risk}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950 p-4">
          <p className="text-xs uppercase text-slate-500">
            Progress
          </p>

          <p className="mt-2 text-2xl font-black text-blue-300">
            {progress}%
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950 p-4">
          <p className="text-xs uppercase text-slate-500">
            AI Suggestions
          </p>

          <ul className="mt-3 space-y-2">
            {suggestions.map((item) => (
              <li
                key={item}
                className="text-sm text-slate-300"
              >
                • {item}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}