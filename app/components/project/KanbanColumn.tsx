"use client";

import { useDroppable } from "@dnd-kit/core";

export default function KanbanColumn({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <section
      ref={setNodeRef}
      className={`min-h-[500px] rounded-3xl border p-5 transition ${
        isOver
          ? "border-blue-500 bg-blue-950/30"
          : "border-slate-800 bg-slate-900"
      }`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-white">{title}</h2>

        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
          {count}
        </span>
      </div>

      <div className="min-h-40 space-y-4">{children}</div>
    </section>
  );
}