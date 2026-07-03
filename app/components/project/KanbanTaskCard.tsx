type Task = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  assignedTo: {
    name: string | null;
    email: string;
  } | null;
  attachments: {
    id: number;
  }[];
  comments: {
    id: number;
  }[];
  checklistItems: {
    id: number;
    completed: boolean;
  }[];
};

export default function KanbanTaskCard({
  task,
}: {
  task: Task;
}) {
  const completedChecklist = task.checklistItems.filter(
    (item) => item.completed,
  ).length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-sm transition hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-6 text-white">
          {task.title}
        </h3>

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

      {task.description && (
        <p className="mb-4 line-clamp-2 text-sm text-slate-400">
          {task.description}
        </p>
      )}

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Assignee</span>

          <span className="text-slate-300">
            {task.assignedTo?.name ??
              task.assignedTo?.email ??
              "Unassigned"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Due</span>

          <span
            className={
              task.dueDate &&
              task.status !== "COMPLETED" &&
              task.dueDate < new Date()
                ? "text-red-400"
                : "text-slate-300"
            }
          >
            {task.dueDate
              ? task.dueDate.toLocaleDateString()
              : "-"}
          </span>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-4">
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div>
            <p className="font-bold text-white">
              {completedChecklist}/{task.checklistItems.length}
            </p>

            <p className="text-slate-500">
              Checklist
            </p>
          </div>

          <div>
            <p className="font-bold text-white">
              {task.comments.length}
            </p>

            <p className="text-slate-500">
              Comments
            </p>
          </div>

          <div>
            <p className="font-bold text-white">
              {task.attachments.length}
            </p>

            <p className="text-slate-500">
              Files
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}