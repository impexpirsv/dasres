"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  pointerWithin,
rectIntersection,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import KanbanTaskCard from "./KanbanTaskCard";

const columns = [
  { title: "Todo", status: "TODO" },
  { title: "In Progress", status: "IN_PROGRESS" },
  { title: "Review", status: "REVIEW" },
  { title: "Completed", status: "COMPLETED" },
];

const columnStatuses = columns.map((column) => column.status);

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
  attachments: { id: number }[];
  comments: { id: number }[];
  checklistItems: {
    id: number;
    completed: boolean;
  }[];
};

export default function ProjectBoard({ tasks }: { tasks: Task[] }) {
  const router = useRouter();

  const [boardTasks, setBoardTasks] = useState(tasks);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setBoardTasks(tasks);
  }, [tasks]);

  function getTargetStatus(overId: string | number) {
    const value = String(overId);

    if (columnStatuses.includes(value)) {
      return value;
    }

    const overTask = boardTasks.find(
      (task) => task.id === Number(overId),
    );

    return overTask?.status || null;
  }

  async function persistStatus(taskId: number, status: string) {
    const response = await fetch(`/api/project-tasks/${taskId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update task status.");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const task = boardTasks.find(
      (item) => item.id === Number(event.active.id),
    );

    setOriginalStatus(task?.status || null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeTaskId = Number(active.id);
    const targetStatus = getTargetStatus(over.id);

    if (!targetStatus) return;

    setBoardTasks((currentTasks) => {
      const activeIndex = currentTasks.findIndex(
        (task) => task.id === activeTaskId,
      );

      if (activeIndex === -1) return currentTasks;

      const activeTask = currentTasks[activeIndex];

      const overTask = currentTasks.find(
        (task) => task.id === Number(over.id),
      );

      const updatedTasks = currentTasks.map((task) =>
        task.id === activeTaskId
          ? {
              ...task,
              status: targetStatus,
            }
          : task,
      );

      if (!overTask) {
        return updatedTasks;
      }

      const overIndex = updatedTasks.findIndex(
        (task) => task.id === overTask.id,
      );

      if (overIndex === -1) return updatedTasks;

      if (
        activeTask.status !== targetStatus ||
        activeIndex !== overIndex
      ) {
        return arrayMove(updatedTasks, activeIndex, overIndex);
      }

      return updatedTasks;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      setOriginalStatus(null);
      return;
    }

    const taskId = Number(active.id);
    const targetStatus = getTargetStatus(over.id);

    if (!targetStatus) {
      setOriginalStatus(null);
      return;
    }

    if (originalStatus && originalStatus !== targetStatus) {
      persistStatus(taskId, targetStatus)
        .then(() => {
          router.refresh();
        })
        .catch(() => {
          setBoardTasks(tasks);
          alert("Failed to update task status.");
        });
    }

    setOriginalStatus(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  return rectIntersection(args);
}}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6 xl:grid-cols-4">
        {columns.map((column) => {
          const columnTasks = boardTasks.filter(
            (task) => task.status === column.status,
          );

          return (
            <KanbanColumn
              key={column.status}
              id={column.status}
              title={column.title}
              count={columnTasks.length}
            >
              <SortableContext
                items={columnTasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnTasks.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">
                    No tasks
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <KanbanTaskCard key={task.id} task={task} />
                  ))
                )}
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>
    </DndContext>
  );
}