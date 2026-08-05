"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import KanbanTaskCard from "./KanbanTaskCard";

const COLUMNS = [
  {
    status: "TODO",
    translationKey: "todo",
  },
  {
    status: "IN_PROGRESS",
    translationKey: "inProgress",
  },
  {
    status: "REVIEW",
    translationKey: "review",
  },
  {
    status: "COMPLETED",
    translationKey: "completed",
  },
] as const;

type TaskStatus =
  (typeof COLUMNS)[number]["status"];

const COLUMN_STATUSES: readonly TaskStatus[] =
  COLUMNS.map(
    (column) => column.status,
  );

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

function isTaskStatus(
  value: string,
): value is TaskStatus {
  return COLUMN_STATUSES.includes(
    value as TaskStatus,
  );
}

export default function ProjectBoard({
  tasks,
}: {
  tasks: Task[];
}) {
  const t = useTranslations(
    "projectBoard",
  );

  const router = useRouter();

  const [boardTasks, setBoardTasks] =
    useState<Task[]>(tasks);

  const [
    originalStatus,
    setOriginalStatus,
  ] = useState<TaskStatus | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter:
        sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setBoardTasks(tasks);
  }, [tasks]);

  function getTargetStatus(
    overId: string | number,
    currentTasks: Task[],
  ): TaskStatus | null {
    const normalizedOverId =
      String(overId);

    if (
      isTaskStatus(normalizedOverId)
    ) {
      return normalizedOverId;
    }

    const overTask =
      currentTasks.find(
        (task) =>
          task.id ===
          Number(overId),
      );

    if (
      !overTask ||
      !isTaskStatus(
        overTask.status,
      )
    ) {
      return null;
    }

    return overTask.status;
  }

  async function persistStatus(
    taskId: number,
    status: TaskStatus,
  ): Promise<void> {
    const response = await fetch(
      `/api/project-tasks/${taskId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      },
    );

    let data: {
      message?: string;
    } = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          t("updateError"),
      );
    }
  }

  function handleDragStart(
    event: DragStartEvent,
  ): void {
    const taskId = Number(
      event.active.id,
    );

    const task = boardTasks.find(
      (item) =>
        item.id === taskId,
    );

    setOriginalStatus(
      task &&
        isTaskStatus(
          task.status,
        )
        ? task.status
        : null,
    );
  }

  function handleDragOver(
    event: DragOverEvent,
  ): void {
    const { active, over } =
      event;

    if (!over) {
      return;
    }

    const activeTaskId =
      Number(active.id);

    if (
      !Number.isInteger(
        activeTaskId,
      ) ||
      activeTaskId <= 0
    ) {
      return;
    }

    setBoardTasks(
      (currentTasks) => {
        const targetStatus =
          getTargetStatus(
            over.id,
            currentTasks,
          );

        if (!targetStatus) {
          return currentTasks;
        }

        const activeTask =
          currentTasks.find(
            (task) =>
              task.id ===
              activeTaskId,
          );

        if (!activeTask) {
          return currentTasks;
        }

        if (
          activeTask.status ===
          targetStatus
        ) {
          return currentTasks;
        }

        return currentTasks.map(
          (task) =>
            task.id ===
            activeTaskId
              ? {
                  ...task,
                  status:
                    targetStatus,
                }
              : task,
        );
      },
    );
  }

  async function handleDragEnd(
    event: DragEndEvent,
  ): Promise<void> {
    const { active, over } =
      event;

    if (!over) {
      setBoardTasks(tasks);
      setOriginalStatus(null);
      return;
    }

    const taskId = Number(
      active.id,
    );

    if (
      !Number.isInteger(taskId) ||
      taskId <= 0
    ) {
      setBoardTasks(tasks);
      setOriginalStatus(null);
      return;
    }

    const movedTask =
      boardTasks.find(
        (task) =>
          task.id === taskId,
      );

    const targetStatus =
      movedTask &&
      isTaskStatus(
        movedTask.status,
      )
        ? movedTask.status
        : getTargetStatus(
            over.id,
            boardTasks,
          );

    if (
      !originalStatus ||
      !targetStatus
    ) {
      setBoardTasks(tasks);
      setOriginalStatus(null);
      return;
    }

    if (
      originalStatus ===
      targetStatus
    ) {
      setBoardTasks(tasks);
      setOriginalStatus(null);
      return;
    }

    try {
      await persistStatus(
        taskId,
        targetStatus,
      );

      router.refresh();
    } catch (error) {
      setBoardTasks(tasks);

      alert(
        error instanceof Error
          ? error.message
          : t("updateError"),
      );
    } finally {
      setOriginalStatus(null);
    }
  }

  function handleDragCancel(): void {
    setBoardTasks(tasks);
    setOriginalStatus(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        const pointerCollisions =
          pointerWithin(args);

        if (
          pointerCollisions.length >
          0
        ) {
          return pointerCollisions;
        }

        return rectIntersection(
          args,
        );
      }}
      onDragStart={
        handleDragStart
      }
      onDragOver={handleDragOver}
      onDragEnd={(event) => {
        void handleDragEnd(
          event,
        );
      }}
      onDragCancel={
        handleDragCancel
      }
    >
      <div className="workspace-horizontal-scroll -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 sm:-mx-4 sm:px-4 xl:mx-0 xl:grid xl:grid-cols-4 xl:gap-4 xl:overflow-visible xl:px-0 xl:pb-0">
        {COLUMNS.map(
          (column) => {
            const columnTasks =
              boardTasks.filter(
                (task) =>
                  task.status ===
                  column.status,
              );

            return (
              <KanbanColumn
                key={
                  column.status
                }
                id={column.status}
                title={t(
                  `columns.${column.translationKey}`,
                )}
                count={
                  columnTasks.length
                }
              >
                <SortableContext
                  items={columnTasks.map(
                    (task) =>
                      task.id,
                  )}
                  strategy={
                    verticalListSortingStrategy
                  }
                >
                  {columnTasks.length ===
                  0 ? (
                    <p className="ui-empty rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                      {t(
                        "emptyColumn",
                      )}
                    </p>
                  ) : (
                    columnTasks.map(
                      (task) => (
                        <KanbanTaskCard
                          key={
                            task.id
                          }
                          task={task}
                        />
                      ),
                    )
                  )}
                </SortableContext>
              </KanbanColumn>
            );
          },
        )}
      </div>
    </DndContext>
  );
}
