"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import faLocale from "@fullcalendar/core/locales/fa";
import arLocale from "@fullcalendar/core/locales/ar";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  priority?: string;
  startDate: Date | string | null;
  dueDate: Date | string | null;
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

function toDateOnly(
  value: Date | string | null,
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
}

function getCalendarLocale(locale: string) {
  if (locale.startsWith("fa")) {
    return "fa";
  }

  if (locale.startsWith("ar")) {
    return "ar";
  }

  return "en";
}

export default function ProjectCalendarView({
  tasks,
}: {
  tasks: Task[];
}) {
  const t = useTranslations("projectCalendarView");
  const locale = useLocale();
  const router = useRouter();

  const calendarLocale =
    getCalendarLocale(locale);

  const events = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            task.startDate || task.dueDate,
        )
        .map((task) => {
          const eventDate = toDateOnly(
            task.dueDate ?? task.startDate,
          );

          return {
            id: String(task.id),
            title: task.title,
            start: eventDate,
            allDay: true,
            backgroundColor:
              getStatusColor(task.status),
            borderColor:
              getStatusColor(task.status),
            extendedProps: {
              task,
            },
          };
        })
        .filter((event) => event.start),
    [tasks],
  );

  async function updateTaskDate(
    taskId: string,
    date: Date | null,
  ) {
    const task = tasks.find(
      (item) => String(item.id) === taskId,
    );

    if (!task || !date) {
      throw new Error(t("invalidTaskDate"));
    }

    const dateOnly = toDateOnly(date);

    if (!dateOnly) {
      throw new Error(t("invalidTaskDate"));
    }

    const response = await fetch(
      `/api/project-tasks/${task.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          description:
            task.description?.trim() || null,
          priority:
            task.priority || "MEDIUM",
          startDate:
            toDateOnly(task.startDate) ??
            dateOnly,
          dueDate: dateOnly,
        }),
      },
    );

    let data: {
      message?: string;
    } = {};

    try {
      data = await response.json();
    } catch {
      // API may return an empty or non-JSON response.
    }

    if (!response.ok) {
      throw new Error(
        data.message || t("updateError"),
      );
    }

    router.refresh();
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">
          {t("title")}
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          {t("description")}
        </p>
      </div>

      <div
        dir={
          calendarLocale === "en"
            ? "ltr"
            : "rtl"
        }
        className="overflow-x-auto"
      >
        <div className="min-w-[700px]">
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
            ]}
            locales={[faLocale, arLocale]}
            locale={calendarLocale}
            initialView="dayGridMonth"
            height="auto"
            events={events}
            editable
            selectable
            displayEventTime={false}
            timeZone="local"
            eventStartEditable
            eventDurationEditable={false}
            headerToolbar={{
              start: "prev,next today",
              center: "title",
              end: "dayGridMonth,timeGridWeek",
            }}
            buttonText={{
              today: t("buttons.today"),
              month: t("buttons.month"),
              week: t("buttons.week"),
            }}
            eventClick={(info) => {
              const searchParams =
                new URLSearchParams(
                  window.location.search,
                );

              searchParams.set("tab", "tasks");
              searchParams.set(
                "task",
                info.event.id,
              );

              router.push(
                `?${searchParams.toString()}`,
              );
            }}
            eventDrop={async (info) => {
              try {
                await updateTaskDate(
                  info.event.id,
                  info.event.start,
                );
              } catch (error) {
                info.revert();

                alert(
                  error instanceof Error
                    ? error.message
                    : t("updateError"),
                );
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}