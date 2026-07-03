import Link from "next/link";

type Task = {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  project: {
    id: number;
    title: string;
  };
};

type Props = {
  tasks: Task[];
};

export default function DashboardMyTasks({ tasks }: Props) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">My Assigned Tasks</h2>

        <Link
          href="/dashboard/my-tasks"
          className="text-blue-400 hover:underline text-sm"
        >
          View all
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="text-slate-500">No assigned tasks.</p>
      ) : (
        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => (
            <Link
              key={task.id}
              href={`/dashboard/projects/${task.project.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-950 p-4 hover:border-blue-500"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold">{task.title}</p>

                  <p className="text-sm text-slate-400 mt-1">
                    {task.project.title}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      task.status === "COMPLETED"
                        ? "bg-green-600 text-white"
                        : task.status === "IN_PROGRESS"
                          ? "bg-yellow-600 text-white"
                          : task.status === "TODO"
                            ? "bg-slate-700 text-white"
                            : "bg-blue-600 text-white"
                    }`}
                  >
                    {task.status}
                  </span>

                  {task.dueDate && (
                    <span
                      className={`text-xs ${
                        task.status !== "COMPLETED" && task.dueDate < new Date()
                          ? "text-red-400"
                          : "text-slate-400"
                      }`}
                    >
                      {task.dueDate.toLocaleDateString("en-US")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
