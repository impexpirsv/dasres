import CreateProjectTaskForm from "./CreateProjectTaskForm";
import ProjectTaskStatusSelect from "./ProjectTaskStatusSelect";
import EditProjectTaskForm from "./EditProjectTaskForm";
import ProjectTaskAttachmentUpload from "./ProjectTaskAttachmentUpload";
import ProjectTaskComments from "./ProjectTaskComments";
import ProjectTaskChecklist from "./ProjectTaskChecklist";
import AssignTaskSelect from "./AssignTaskSelect";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignedToId: number | null;
  assignedTo: UserOption | null;
  attachments: {
    id: number;
    fileName: string;
    fileUrl: string;
    uploadedBy: UserOption | null;
  }[];
  comments: Parameters<typeof ProjectTaskComments>[0]["comments"];
  checklistItems: {
    id: number;
    title: string;
    completed: boolean;
  }[];
};

export default function ProjectTasksSection({
  projectId,
  tasks,
  assignableUsers,
  isAdmin,
}: {
  projectId: number;
  tasks: Task[];
  assignableUsers: UserOption[];
  isAdmin: boolean;
}) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-5">Trade Tasks</h2>

      <div className="mb-6">
        <CreateProjectTaskForm projectId={projectId} />
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold">{task.title}</h3>

              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  task.priority === "URGENT"
                    ? "bg-red-600"
                    : task.priority === "HIGH"
                      ? "bg-orange-600"
                      : task.priority === "MEDIUM"
                        ? "bg-yellow-600"
                        : "bg-slate-700"
                }`}
              >
                {task.priority}
              </span>
            </div>

            {task.description && (
              <p className="text-sm text-slate-400 mt-2">
                {task.description}
              </p>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Assigned to
                </p>

                {isAdmin ? (
                  <AssignTaskSelect
                    taskId={task.id}
                    assignedToId={task.assignedToId}
                    users={assignableUsers}
                  />
                ) : (
                  <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                    {task.assignedTo?.name ||
                      task.assignedTo?.email ||
                      "Unassigned"}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Due Date
                </p>

                <p
                  className={`rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm ${
                    task.dueDate &&
                    task.status !== "COMPLETED" &&
                    task.dueDate < new Date()
                      ? "text-red-400"
                      : "text-slate-300"
                  }`}
                >
                  {task.dueDate
                    ? task.dueDate.toLocaleDateString("en-US")
                    : "No due date"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <ProjectTaskStatusSelect
                taskId={task.id}
                currentStatus={task.status}
              />
            </div>

            <div className="mt-4">
              <EditProjectTaskForm
                taskId={task.id}
                currentTitle={task.title}
                currentDescription={task.description}
                currentPriority={task.priority}
                currentDueDate={task.dueDate}
                currentAssignedToId={task.assignedToId}
                assignableUsers={assignableUsers}
              />
            </div>

            <div className="mt-4">
              <ProjectTaskAttachmentUpload taskId={task.id} />
            </div>

            {task.attachments.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-300">
                  Attachments
                </p>

                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-blue-400 hover:border-blue-500"
                    >
                      <div className="font-semibold">
                        {attachment.fileName}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Uploaded by{" "}
                        {attachment.uploadedBy?.name ||
                          attachment.uploadedBy?.email ||
                          "Unknown"}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <ProjectTaskComments
              taskId={task.id}
              comments={task.comments}
            />

            <ProjectTaskChecklist
              taskId={task.id}
              items={task.checklistItems}
            />
          </div>
        ))}
      </div>
    </section>
  );
}