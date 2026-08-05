"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
type Task = {
  id: number;
  title: string;
  status: string;
  progress?: number | null;
  startDate: Date | null;
  dueDate: Date | null;
  dependsOn?: {
    id: number;
    title: string;
    status?: string;
  } | null;
};

type DependencyType = "FS" | "SS" | "FF" | "SF";
type ZoomLevel = "day" | "week" | "month";
type GanttTask = Task & {
  start: Date;
  end: Date;
  dependencyType: DependencyType;
  isCritical: boolean;
  isMilestone: boolean;
  baselineX: number;
  baselineY: number;
  baselineWidth: number;
  rowIndex: number;
  offset: number;
  duration: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DependencyLine = {
  id: string;
  path: string;
  color: string;
  markerId: string;
  isBlocked: boolean;
};

function getDateOnly(date: Date | string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  value.setHours(0, 0, 0, 0);

  return value;
}

function getDaysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;

  return Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / msPerDay) + 1,
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "TODO":
      return "bg-slate-500";
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "REVIEW":
      return "bg-amber-500";
    case "COMPLETED":
      return "bg-green-500";
    default:
      return "bg-indigo-500";
  }
}

function getColumnWidth(zoomLevel: ZoomLevel) {
  switch (zoomLevel) {
    case "week":
      return 96;
    case "month":
      return 120;
    default:
      return 56;
  }
}

function getUnitStart(date: Date, zoomLevel: ZoomLevel) {
  const value = getDateOnly(date);

  if (!value) {
    return new Date(date);
  }

  if (zoomLevel === "week") {
    const day = value.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    value.setDate(value.getDate() + diff);
  }

  if (zoomLevel === "month") {
    value.setDate(1);
  }

  return value;
}

function addUnit(date: Date, zoomLevel: ZoomLevel, amount = 1) {
  const value = new Date(date);

  if (zoomLevel === "day") {
    value.setDate(value.getDate() + amount);
  }

  if (zoomLevel === "week") {
    value.setDate(value.getDate() + amount * 7);
  }

  if (zoomLevel === "month") {
    value.setMonth(value.getMonth() + amount);
  }

  return value;
}

function getUnitsBetween(start: Date, end: Date, zoomLevel: ZoomLevel) {
  let count = 0;
  let cursor = getUnitStart(start, zoomLevel);
  const finalDate = getUnitStart(end, zoomLevel);

  while (cursor <= finalDate) {
    count += 1;
    cursor = addUnit(cursor, zoomLevel);
  }

  return Math.max(1, count);
}

function getOffsetBetween(start: Date, target: Date, zoomLevel: ZoomLevel) {
  let offset = 0;
  let cursor = getUnitStart(start, zoomLevel);
  const finalDate = getUnitStart(target, zoomLevel);

  while (cursor < finalDate) {
    offset += 1;
    cursor = addUnit(cursor, zoomLevel);
  }

  return Math.max(0, offset);
}

function getUnitLabel(
  date: Date,
  zoomLevel: ZoomLevel,
  locale: string,
  weekLabel: string,
) {
  if (zoomLevel === "month") {
    return {
      top: new Intl.DateTimeFormat(locale, {
        month: "short",
      }).format(date),
      bottom: new Intl.NumberFormat(locale, {
        useGrouping: false,
      }).format(date.getFullYear()),
    };
  }

  if (zoomLevel === "week") {
    const weekEnd = addUnit(date, "day", 6);

    return {
      top: weekLabel,
      bottom: `${new Intl.NumberFormat(locale).format(
        date.getDate(),
      )}-${new Intl.NumberFormat(locale).format(weekEnd.getDate())}`,
    };
  }

  return {
    top: new Intl.DateTimeFormat(locale, {
      weekday: "short",
    }).format(date),
    bottom: new Intl.NumberFormat(locale).format(date.getDate()),
  };
}
function buildDependencyPath(
  fromTask: GanttTask,
  toTask: GanttTask,
  dependencyType: DependencyType = "FS",
) {
  const horizontalGap = 48;
  const verticalPadding = 32;

  const fromStartX = fromTask.x;
  const fromFinishX = fromTask.x + fromTask.width;
  const fromY = fromTask.y + fromTask.height / 2;

  const toStartX = toTask.x;
  const toFinishX = toTask.x + toTask.width;
  const toY = toTask.y + toTask.height / 2;

  const startX =
    dependencyType === "SS" || dependencyType === "SF"
      ? fromStartX
      : fromFinishX;

  const endX =
    dependencyType === "FF" || dependencyType === "SF" ? toFinishX : toStartX;

  const finalEndX = endX + 4;
  if (finalEndX > startX + horizontalGap) {
    const midX = startX + horizontalGap;

    return `
      M ${startX} ${fromY}
      H ${midX}
      V ${toY}
     H ${finalEndX}
    `;
  }

  const detourX = Math.max(startX, finalEndX) + horizontalGap * 1;

  const detourY = toY > fromY ? toY + verticalPadding : toY - verticalPadding;

  return `
    M ${startX} ${fromY}
    H ${detourX}
    V ${detourY}
   H ${finalEndX - horizontalGap}
    V ${toY}
   H ${finalEndX}
  `;
}

function buildDependencyLines(ganttTasks: GanttTask[]) {
  return ganttTasks
    .map((task) => {
      if (!task.dependsOn) return null;

      const dependencyTask = ganttTasks.find(
        (item) => item.id === task.dependsOn?.id,
      );

      if (!dependencyTask) return null;

      const dependencyCompleted = dependencyTask.status === "COMPLETED";

      const isBlocked = !dependencyCompleted && task.status !== "COMPLETED";

      const color = dependencyCompleted
        ? "#22c55e"
        : isBlocked
          ? "#ef4444"
          : "#60a5fa";

      const markerId = dependencyCompleted
        ? "dependency-arrow-green"
        : isBlocked
          ? "dependency-arrow-red"
          : "dependency-arrow-blue";

      return {
        id: `${dependencyTask.id}-${task.id}`,
        path: buildDependencyPath(dependencyTask, task, task.dependencyType),
        color,
        markerId,
        isBlocked,
      };
    })
    .filter(Boolean) as DependencyLine[];
}

export default function ProjectGanttView({ tasks }: { tasks: Task[] }) {
  const t = useTranslations("projectGanttView");
  const locale = useLocale();
  const isRtl = locale.startsWith("fa") || locale.startsWith("ar");
  const rowHeight = 64;
  const barHeight = 30;
  const taskColumnWidth = 260;
  const canvasPadding = 96;
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("day");

  const columnWidth = getColumnWidth(zoomLevel);

  const datedTasksBase = tasks
    .filter((task) => task.startDate || task.dueDate)
    .map((task) => {
      const start = getDateOnly(task.startDate ?? task.dueDate!);

      const end = getDateOnly(task.dueDate ?? task.startDate!);

      if (!start || !end) {
        return null;
      }

      const normalizedStart = start.getTime() <= end.getTime() ? start : end;

      const normalizedEnd = end.getTime() >= start.getTime() ? end : start;

      return {
        ...task,
        start: normalizedStart,
        end: normalizedEnd,
      };
    })
    .filter(
      (
        task,
      ): task is Task & {
        start: Date;
        end: Date;
      } => task !== null,
    );

  if (datedTasksBase.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
        {t("emptyState")}
      </div>
    );
  }

  const minDate = new Date(
    Math.min(...datedTasksBase.map((task) => task.start.getTime())),
  );

  const maxDate = new Date(
    Math.max(...datedTasksBase.map((task) => task.end.getTime())),
  );

  const timelineStart = getUnitStart(minDate, zoomLevel);
  const timelineEnd = getUnitStart(maxDate, zoomLevel);

  const totalUnits = getUnitsBetween(timelineStart, timelineEnd, zoomLevel);
  const timelineWidth = taskColumnWidth + totalUnits * columnWidth;
  const chartWidth = canvasPadding + timelineWidth + canvasPadding;
  const chartHeight = datedTasksBase.length * rowHeight;
  const datedTaskById = new Map(datedTasksBase.map((task) => [task.id, task]));

  const criticalPathMemo = new Map<number, { ids: number[]; duration: number }>();

  function getCriticalPathToTask(
    taskId: number,
    visiting = new Set<number>(),
  ): { ids: number[]; duration: number } {
    const cached = criticalPathMemo.get(taskId);

    if (cached) {
      return cached;
    }

    const task = datedTaskById.get(taskId);

    if (!task) {
      return { ids: [], duration: 0 };
    }

    const taskDuration = getDaysBetween(task.start, task.end);

    if (visiting.has(taskId)) {
      return { ids: [task.id], duration: taskDuration };
    }

    const nextVisiting = new Set(visiting);
    nextVisiting.add(taskId);

    const dependencyId = task.dependsOn?.id;
    const dependencyPath =
      dependencyId !== undefined && datedTaskById.has(dependencyId)
        ? getCriticalPathToTask(dependencyId, nextVisiting)
        : { ids: [], duration: 0 };

    const result = {
      ids: [...dependencyPath.ids, task.id],
      duration: dependencyPath.duration + taskDuration,
    };

    criticalPathMemo.set(taskId, result);
    return result;
  }

  const longestCriticalPath = datedTasksBase.reduce(
    (longest, task) => {
      const candidate = getCriticalPathToTask(task.id);
      return candidate.duration > longest.duration ? candidate : longest;
    },
    { ids: [] as number[], duration: 0 },
  );

  const criticalTaskIds = new Set(longestCriticalPath.ids);

  const ganttTasks: GanttTask[] = datedTasksBase.map((task, index) => {
    const offset = getOffsetBetween(timelineStart, task.start, zoomLevel);
    const duration =
      zoomLevel === "day"
        ? getDaysBetween(task.start, task.end)
        : getUnitsBetween(task.start, task.end, zoomLevel);

    const isMilestone = task.start.getTime() === task.end.getTime();
    const baselineX =
      canvasPadding + taskColumnWidth + offset * columnWidth + 8;
    const baselineY =
      index * rowHeight + (rowHeight - barHeight) / 2 + barHeight + 6;
    const baselineWidth = isMilestone
      ? 24
      : Math.max(24, duration * columnWidth - 16);
    const normalizedProgress = Math.min(
      100,
      Math.max(0, Number(task.progress)),
    );
    return {
      ...task,
      progress: normalizedProgress,
      dependencyType: "FS",
      isMilestone,
      isCritical: criticalTaskIds.has(task.id),
      baselineX,
      baselineY,
      baselineWidth,
      rowIndex: index,
      offset,
      duration,
      x: canvasPadding + taskColumnWidth + offset * columnWidth + 8,
      y: index * rowHeight + (rowHeight - barHeight) / 2,
      width: isMilestone ? 24 : Math.max(24, duration * columnWidth - 16),
      height: barHeight,
    };
  });

  const dependencyLines = buildDependencyLines(ganttTasks);

  const today = getDateOnly(new Date()) ?? new Date();
  const todayOffset = getOffsetBetween(timelineStart, today, zoomLevel);
  const timelineLastDate = addUnit(timelineEnd, zoomLevel, 1);

  const showTodayLine =
    zoomLevel === "day" && today >= timelineStart && today < timelineLastDate;

  function getTranslatedStatus(status: string) {
    switch (status) {
      case "TODO":
        return t("statuses.todo");

      case "IN_PROGRESS":
        return t("statuses.in_progress");

      case "REVIEW":
        return t("statuses.review");

      case "COMPLETED":
        return t("statuses.completed");

      default:
        return t("statuses.unknown");
    }
  }
  return (
    <div className="workspace-panel">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{t("title")}</h2>

          <p className="mt-1 text-sm text-slate-400">{t("description")}</p>
        </div>

        <div
          dir={isRtl ? "rtl" : "ltr"}
          className="flex flex-wrap items-center gap-2"
        >
          {(["day", "week", "month"] as ZoomLevel[]).map((level) => (
            <button
              key={t(`zoom.${level}`)}
              type="button"
              onClick={() => setZoomLevel(level)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                zoomLevel === level
                  ? "border-blue-500 bg-blue-500/10 text-blue-300"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
              }`}
            >
             {t(`zoom.${level}`)}
            </button>
          ))}

          <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-blue-300">
            {t("taskCount", {
              count: ganttTasks.length,
            })}
          </div>
        </div>
      </div>

      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="workspace-horizontal-scroll overflow-x-auto rounded-xl border border-slate-800 bg-slate-950"
      >
        <div
          dir="ltr"
          className="relative"
          style={{
            width: `${chartWidth}px`,
            minWidth: "900px",
          }}
        >
          <div
            className="grid border-b border-slate-800 bg-slate-900/80"
            style={{
              gridTemplateColumns: `${canvasPadding}px ${taskColumnWidth}px repeat(${totalUnits}, ${columnWidth}px)`,
            }}
          >
            <div
              dir={isRtl ? "rtl" : "ltr"}
              className={`px-4 py-3 text-start text-xs font-semibold tracking-wide text-slate-500 ${
                isRtl
                  ? "border-l border-slate-800"
                  : "border-r border-slate-800"
              }`}
            >
              {t("taskColumn")}
            </div>
            <div
              className={
                isRtl
                  ? "border-l border-slate-800"
                  : "border-r border-slate-800"
              }
            />
            <div
              className="flex items-center justify-center py-3 text-sm font-bold text-white"
              style={{
                gridColumn: `3 / span ${totalUnits}`,
              }}
            >
              {t("dateRange", {
                start: new Intl.DateTimeFormat(locale, {
                  month: "long",
                  year: "numeric",
                }).format(minDate),
                end: new Intl.DateTimeFormat(locale, {
                  month: "long",
                  year: "numeric",
                }).format(maxDate),
              })}
            </div>
          </div>

          <div
            className="grid border-b border-slate-800 bg-slate-900/60"
            style={{
              gridTemplateColumns: `${canvasPadding}px ${taskColumnWidth}px repeat(${totalUnits}, ${columnWidth}px)`,
            }}
          >
            <div
              className={
                isRtl
                  ? "border-l border-slate-800"
                  : "border-r border-slate-800"
              }
            />
            <div
              dir={isRtl ? "rtl" : "ltr"}
              className={`px-4 py-2 text-start text-xs text-slate-500 ${
                isRtl
                  ? "border-l border-slate-800"
                  : "border-r border-slate-800"
              }`}
            >
              {t("timeline")}
            </div>

            {Array.from({ length: totalUnits }).map((_, index) => {
              const day = addUnit(timelineStart, zoomLevel, index);
              const label = getUnitLabel(day, zoomLevel, locale, t("week"));

              const isToday =
                zoomLevel === "day" && day.getTime() === today.getTime();

              return (
                <div
                  key={index}
                  className={`border-r border-slate-800 px-2 py-2 text-center text-xs ${
                    isToday
                      ? "bg-blue-600/20 font-bold text-blue-300"
                      : "text-slate-400"
                  }`}
                >
                  <div>{label.top}</div>
                  <div className="mt-1 font-semibold">{label.bottom}</div>
                </div>
              );
            })}
          </div>

          <div
            className="relative"
            style={{
              height: `${chartHeight}px`,
            }}
          >
            {showTodayLine && (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-30 w-px bg-blue-400/70"
                style={{
                  left: `${canvasPadding + taskColumnWidth + todayOffset * columnWidth + columnWidth / 2}px`,
                }}
              />
            )}

            <svg
              className="pointer-events-none absolute left-0 top-0 z-40"
              width={chartWidth}
              height={chartHeight}
            >
              <defs>
                <marker
                  id="dependency-arrow-blue"
                  markerWidth="10"
                  markerHeight="10"
                  refX="12"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#60a5fa" />
                </marker>

                <marker
                  id="dependency-arrow-green"
                  markerWidth="10"
                  markerHeight="10"
                  refX="12"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#22c55e" />
                </marker>

                <marker
                  id="dependency-arrow-red"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                </marker>
              </defs>

              {dependencyLines.map((line) => (
                <path
                  key={line.id}
                  d={line.path}
                  stroke={line.color}
                  strokeWidth={line.isBlocked ? "3" : "2"}
                  fill="none"
                  markerEnd={`url(#${line.markerId})`}
                  opacity={line.isBlocked ? "1" : "0.85"}
                />
              ))}
            </svg>

            {ganttTasks.map((task) => {
              const isBlocked =
                Boolean(task.dependsOn) &&
                task.dependsOn?.status !== "COMPLETED" &&
                task.status !== "COMPLETED";
              const hasOutgoingDependency = ganttTasks.some(
                (item) => item.dependsOn?.id === task.id,
              );
              return (
                <div
                  key={task.id}
                  className="absolute left-0 border-b border-slate-800/70 last:border-b-0"
                  style={{
                    top: `${task.rowIndex * rowHeight}px`,
                    width: `${chartWidth}px`,
                    height: `${rowHeight}px`,
                  }}
                >
                  <div
                    className={`absolute top-0 flex items-center px-4 ${
                      isRtl
                        ? "border-s border-slate-800 text-end"
                        : "border-e border-slate-800 text-start"
                    }`}
                    style={{
                      left: `${canvasPadding}px`,
                      width: `${taskColumnWidth}px`,
                      height: `${rowHeight}px`,
                    }}
                  >
                    <div dir={isRtl ? "rtl" : "ltr"} className="min-w-0 w-full">
                      <p className="truncate text-start text-sm font-semibold text-white">
                        {task.title}
                      </p>
                      <p className="mt-1 text-start text-xs text-slate-500">
                        {getTranslatedStatus(task.status)}
                      </p>
                    </div>
                  </div>

                  {Array.from({ length: totalUnits }).map((_, index) => (
                    <div
                      key={index}
                      className="absolute top-0 border-r border-slate-800/50"
                      style={{
                        left: `${canvasPadding + taskColumnWidth + index * columnWidth}px`,
                        width: `${columnWidth}px`,
                        height: `${rowHeight}px`,
                      }}
                    />
                  ))}
                  {!task.isMilestone && (
                    <div
                      className="absolute z-10 h-1.5 rounded-full bg-white/25"
                      style={{
                        left: `${task.baselineX}px`,
                        top: `${task.baselineY - task.rowIndex * rowHeight}px`,
                        width: `${task.baselineWidth}px`,
                      }}
                      title={t("tooltips.baseline", {
                        title: task.title,
                      })}
                    />
                  )}
                  {task.dependsOn && (
                    <div
                      className="absolute z-50 h-3 w-3 rounded-full border-2 border-blue-300 bg-transparent"
                      style={{
                        left: `${task.x - 6}px`,
                        top: `${task.y - task.rowIndex * rowHeight + task.height / 2 - 6}px`,
                      }}
                      title={t("tooltips.dependencyInput")}
                    />
                  )}

                  {hasOutgoingDependency && (
                    <div
                      className="absolute z-50 h-3 w-3 rounded-full border-2 border-blue-300 bg-transparent"
                      style={{
                        left: `${task.x + task.width - 6}px`,
                        top: `${task.y - task.rowIndex * rowHeight + task.height / 2 - 6}px`,
                      }}
                      title={t("tooltips.dependencyOutput")}
                    />
                  )}
                  {task.isMilestone ? (
                    <div
                      className="absolute z-20 flex items-center justify-center"
                      style={{
                        left: `${task.x}px`,
                        top: `${task.y - task.rowIndex * rowHeight + 4}px`,
                        width: `${task.width}px`,
                        height: `${task.width}px`,
                      }}
                      title={t("tooltips.milestone", {
                        title: task.title,
                      })}
                    >
                      <div
                        className={`h-5 w-5 rotate-45 shadow-lg ${
                          task.isCritical
                            ? "bg-red-500 ring-2 ring-red-300"
                            : getStatusColor(task.status)
                        }`}
                      />
                    </div>
                  ) : (
                    <div
                      className={`absolute z-20 flex items-center rounded-xl shadow-lg transition hover:scale-[1.01] ${
                        task.isCritical
                          ? "bg-red-500 ring-2 ring-red-300"
                          : getStatusColor(task.status)
                      }`}
                      style={{
                        left: `${task.x}px`,
                        top: `${task.y - task.rowIndex * rowHeight}px`,
                        width: `${task.width}px`,
                        height: `${task.height}px`,
                      }}
                      title={t(`tooltips.duration.${zoomLevel}`, {
                        title: task.title,
                        duration: task.duration,
                      })}
                    >
                      <div className="absolute inset-0 overflow-hidden rounded-xl">
                        <div
                          className="h-full bg-white/20"
                          style={{
                            width: `${task.progress}%`,
                          }}
                        />
                      </div>

                      <div
                        dir={isRtl ? "rtl" : "ltr"}
                        className="absolute inset-0 flex items-center justify-between gap-2 px-3 text-xs font-semibold text-white"
                      >
                        <span className="max-w-[140px] truncate text-start">
                          {task.title}
                        </span>

                        <span
                          className="flex shrink-0 items-center gap-2"
                          dir="ltr"
                        >
                          {task.dependsOn && (
                            <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-[10px] font-bold uppercase text-white ring-1 ring-white/20">
                              {task.dependencyType}
                            </span>
                          )}
                          {task.isCritical && (
                            <span className="rounded-full bg-red-950/80 px-2 py-0.5 text-[10px] font-bold text-red-100 ring-1 ring-red-300/50">
                              {t("critical")}
                            </span>
                          )}
                          {isBlocked && (
                            <span className="rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                              {t("blocked")}
                            </span>
                          )}

                          <span className="shrink-0 rounded-full bg-slate-950/70 px-2 py-0.5 text-[10px] font-bold">
                            {task.progress}%
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
