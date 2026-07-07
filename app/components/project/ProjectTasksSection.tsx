"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CreateProjectTaskForm from "./CreateProjectTaskForm";
import ProjectTaskComments from "./ProjectTaskComments";
import ProjectTaskList from "./ProjectTaskList";
import ProjectTaskDetails from "./ProjectTaskDetails";

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
  dependsOn: {
    id: number;
    title: string;
  } | null;

  dependents: {
    id: number;
    title: string;
  }[];
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
  const searchParams = useSearchParams();
  const taskFromUrl = Number(searchParams.get("task"));

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
    Number.isNaN(taskFromUrl) ? (tasks[0]?.id ?? null) : taskFromUrl,
  );

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return tasks;
    }

    return tasks.filter((task) => task.title.toLowerCase().includes(value));
  }, [search, tasks]);

  const visibleSelectedTask =
    filteredTasks.find((task) => task.id === selectedTaskId) ??
    selectedTask ??
    filteredTasks[0] ??
    null;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Project Tasks{" "}
            <span className="text-blue-400">
              (
              {search
                ? `${filteredTasks.length} of ${tasks.length}`
                : tasks.length}
              )
            </span>
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Manage project tasks efficiently.
          </p>
        </div>

        <CreateProjectTaskForm projectId={projectId} />
      </div>

      <input
        type="text"
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <ProjectTaskList
            tasks={filteredTasks}
            selectedTaskId={selectedTaskId}
            onSelect={setSelectedTaskId}
          />
        </div>

        <div className="min-w-0">
          {visibleSelectedTask ? (
            <ProjectTaskDetails
              task={visibleSelectedTask}
              assignableUsers={assignableUsers}
              availableTasks={tasks.map((task) => ({
                id: task.id,
                title: task.title,
              }))}
              isAdmin={isAdmin}
            />
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
              Select a task to view details.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
