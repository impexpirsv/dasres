"use client";
import StatusBadge, {
  type Status,
} from "../StatusBadge";
type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type Task = {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignedTo: UserOption | null;
  checklistItems: {
    id: number;
    completed: boolean;
  }[];
};

export default function ProjectTaskList({
  tasks,
  selectedTaskId,
  onSelect,
}: {
  tasks: Task[];
  selectedTaskId: number | null;
  onSelect: (taskId: number) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-6 text-center text-slate-500">
        No tasks yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const completed = task.checklistItems.filter(
          (item) => item.completed,
        ).length;

        const total = task.checklistItems.length;

        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        const isSelected = selectedTaskId === task.id;

        return (
          <button
            key={task.id}
            type="button"
            onClick={() => onSelect(task.id)}
            className={`w-full rounded-2xl border p-4 text-left transition ${
              isSelected
                ? "border-blue-500 bg-blue-950/30"
                : "border-slate-800 bg-slate-950 hover:border-blue-500"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{task.title}</h3>

                <p className="mt-1 text-xs text-slate-500">
                  {task.assignedTo?.name ||
                    task.assignedTo?.email ||
                    "Unassigned"}
                </p>
              </div>

              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                  task.priority === "URGENT"
                    ? "bg-red-600 text-white"
                    : task.priority === "HIGH"
                      ? "bg-orange-600 text-white"
                      : task.priority === "MEDIUM"
                        ? "bg-yellow-600 text-white"
                        : "bg-slate-700 text-white"
                }`}
              >
                {task.priority}
              </span>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-500">Progress</span>
                <span className="text-slate-300">{percent}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
             <StatusBadge status={task.status as Status} />

              <span>
                {task.dueDate
                  ? task.dueDate.toLocaleDateString("en-US")
                  : "No due date"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
