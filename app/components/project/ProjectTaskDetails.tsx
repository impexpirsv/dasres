"use client";

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
  startDate: Date | null;
  dueDate: Date | null;
  assignedToId: number | null;
  assignedTo: UserOption | null;
  progress: number;
  estimatedHours: number | null;
  loggedHours: number;
  remainingHours: number;
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
 dependsOn?: {
  id: number;
  title: string;
  status?: string;
} | null;

  dependents?: {
  id: number;
  title: string;
  status?: string;
}[];
};

export default function ProjectTaskDetails({
  task,
  assignableUsers,
  availableTasks,
  isAdmin,
}: {
  task: Task | null;
  assignableUsers: UserOption[];
  availableTasks: {
    id: number;
    title: string;
  }[];
  isAdmin: boolean;
}) {
  if (!task) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-500">
        Select a task to view details.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{task.title}</h2>

          {task.description && (
            <p className="mt-2 text-sm text-slate-400">{task.description}</p>
          )}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
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

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Assigned to</p>

          {isAdmin ? (
            <AssignTaskSelect
              taskId={task.id}
              assignedToId={task.assignedToId}
              users={assignableUsers}
            />
          ) : (
            <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
              {task.assignedTo?.name || task.assignedTo?.email || "Unassigned"}
            </p>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Start Date</p>

          <p className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
            {task.startDate
              ? task.startDate.toLocaleDateString("en-US")
              : "No start date"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Due Date</p>

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
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Progress</p>
          <p className="mt-2 text-2xl font-bold text-blue-400">
            {task.progress}%
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Estimated</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {task.estimatedHours}h
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Logged</p>
          <p className="mt-2 text-2xl font-bold text-green-400">
            {task.loggedHours}h
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs text-slate-500">Remaining</p>
          <p className="mt-2 text-2xl font-bold text-yellow-400">
            {task.remainingHours}h
          </p>
        </div>
      </div>
      {task.dependsOn && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-medium text-slate-500">Depends On</p>

          <p className="mt-2 text-sm font-semibold text-white">
            {task.dependsOn.title}
          </p>
        </div>
      )}
     {(task.dependents?.length ?? 0) > 0 && (
  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
    <p className="text-xs font-medium text-slate-500">
      Blocks
    </p>

    <div className="mt-3 space-y-2">
     {task.dependents?.map((dependent) => (
        <div
          key={dependent.id}
          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
        >
          <span className="text-sm font-medium text-white">
            {dependent.title}
          </span>

          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              dependent.status === "COMPLETED"
                ? "bg-green-600/20 text-green-300"
                : dependent.status === "IN_PROGRESS"
                  ? "bg-blue-600/20 text-blue-300"
                  : dependent.status === "REVIEW"
                    ? "bg-yellow-600/20 text-yellow-300"
                    : "bg-slate-700 text-slate-300"
            }`}
          >
            {dependent.status}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
      <div className="mt-5">
        <ProjectTaskStatusSelect taskId={task.id} currentStatus={task.status} />
      </div>

      <div className="mt-5">
        <EditProjectTaskForm
          taskId={task.id}
          currentTitle={task.title}
          currentDescription={task.description}
          currentPriority={task.priority}
          currentStartDate={task.startDate}
          currentDueDate={task.dueDate}
          currentAssignedToId={task.assignedToId}
          assignableUsers={assignableUsers}
         currentEstimatedHours={task.estimatedHours ?? undefined}
         currentLoggedHours={task.loggedHours ?? undefined}
          currentDependsOnId={task.dependsOn?.id}
          availableTasks={availableTasks}
        />
      </div>

      <div className="mt-5">
        <ProjectTaskAttachmentUpload taskId={task.id} />
      </div>

      {task.attachments.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
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
                <div className="font-semibold">{attachment.fileName}</div>

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

      <div className="mt-5">
        <ProjectTaskChecklist taskId={task.id} items={task.checklistItems} />
      </div>

      <div className="mt-5">
        <ProjectTaskComments taskId={task.id} comments={task.comments} />
      </div>
    </div>
  );
}
