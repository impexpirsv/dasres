"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  priority?: string;
  startDate: Date | null;
  dueDate: Date | null;
  status: string;
};

function getStatusColor(status: string) {
  switch (status) {
    case "TODO":
      return "#64748b";
    case "IN_PROGRESS":
      return "#3b82f6";
    case "REVIEW":
      return "#f59e0b";
    case "COMPLETED":
      return "#22c55e";
    default:
      return "#6366f1";
  }
}

function toDateOnly(date: Date | string | null) {
  if (!date) return undefined;

  return new Date(date).toISOString().split("T")[0];
}

export default function ProjectCalendarView({
  tasks,
}: {
  tasks: Task[];
}) {
  const router = useRouter();

  const events = tasks
    .filter((task) => task.startDate || task.dueDate)
    .map((task) => ({
      id: String(task.id),
      title: task.title,
      start: toDateOnly(task.dueDate || task.startDate),
      allDay: true,
      backgroundColor: getStatusColor(task.status),
      borderColor: getStatusColor(task.status),
      extendedProps: {
        task,
      },
    }));

  async function updateTaskDate(taskId: string, date: Date | null) {
    const task = tasks.find((item) => String(item.id) === taskId);

    if (!task || !date) {
      return;
    }

    const dateOnly = date.toISOString().split("T")[0];

    const response = await fetch(`/api/project-tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: task.title,
        description: task.description || "",
        priority: task.priority || "MEDIUM",
        startDate: task.startDate ? toDateOnly(task.startDate) : dateOnly,
        dueDate: dateOnly,
        assignedToId: "",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Could not update task date.");
      throw new Error(data.message || "Could not update task date.");
    }

    router.refresh();
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        events={events}
        editable
        selectable
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        displayEventTime={false}
        timeZone="local"
        eventClick={(info) => {
          router.push(`?tab=tasks&task=${info.event.id}`);
        }}
        eventDrop={async (info) => {
          try {
            await updateTaskDate(info.event.id, info.event.start);
          } catch {
            info.revert();
          }
        }}
      />
    </div>
  );
}