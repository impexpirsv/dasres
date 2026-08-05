"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
    uploadedBy: UserOption | null;
  }[];
  comments: Parameters<
    typeof ProjectTaskComments
  >[0]["comments"];
  checklistItems: {
    id: number;
    title: string;
    completed: boolean;
  }[];
};

function resolveSelectedTaskId(
  taskParam: string | null,
  tasks: Task[],
): number | null {
  if (taskParam !== null) {
    const parsedTaskId =
      Number(taskParam);

    if (
      Number.isInteger(parsedTaskId) &&
      parsedTaskId > 0 &&
      tasks.some(
        (task) =>
          task.id === parsedTaskId,
      )
    ) {
      return parsedTaskId;
    }
  }

  return tasks[0]?.id ?? null;
}

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
  const t = useTranslations(
    "projectTasksSection",
  );

  const searchParams =
    useSearchParams();

  const taskParam =
    searchParams.get("task");

  const [selectedTaskId, setSelectedTaskId] =
    useState<number | null>(() =>
      resolveSelectedTaskId(
        taskParam,
        tasks,
      ),
    );

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    setSelectedTaskId(
      resolveSelectedTaskId(
        taskParam,
        tasks,
      ),
    );
  }, [taskParam, tasks]);

  const filteredTasks = useMemo(() => {
    const value =
      search.trim().toLocaleLowerCase();

    if (!value) {
      return tasks;
    }

    return tasks.filter((task) =>
      task.title
        .toLocaleLowerCase()
        .includes(value),
    );
  }, [search, tasks]);

  const visibleSelectedTask =
    filteredTasks.find(
      (task) =>
        task.id === selectedTaskId,
    ) ??
    filteredTasks[0] ??
    null;

  const availableTasks = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
      })),
    [tasks],
  );

  return (
    <section className="workspace-panel">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t("title")}{" "}
            <span className="text-blue-400">
              (
              {search.trim()
                ? t("filteredCount", {
                    filtered:
                      filteredTasks.length,
                    total:
                      tasks.length,
                  })
                : tasks.length}
              )
            </span>
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {t("description")}
          </p>
        </div>

        <CreateProjectTaskForm
          projectId={projectId}
        />
      </div>

      <input
        type="search"
        placeholder={t(
          "searchPlaceholder",
        )}
        aria-label={t("searchLabel")}
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value,
          )
        }
        className="mb-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(17rem,22.5rem)_minmax(0,1fr)] xl:gap-6">
        <div className="max-h-[75vh] overflow-y-auto pe-1">
          <ProjectTaskList
            tasks={filteredTasks}
            selectedTaskId={
              visibleSelectedTask?.id ??
              null
            }
            onSelect={
              setSelectedTaskId
            }
          />
        </div>

        <div className="min-w-0">
          {visibleSelectedTask ? (
            <ProjectTaskDetails
              task={
                visibleSelectedTask
              }
              assignableUsers={
                assignableUsers
              }
              availableTasks={
                availableTasks
              }
              isAdmin={isAdmin}
            />
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400">
              {search.trim()
                ? t(
                    "noSearchResults",
                  )
                : t("emptyState")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
