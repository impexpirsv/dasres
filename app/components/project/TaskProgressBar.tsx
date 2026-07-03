type ChecklistItem = {
  id: number;
  completed: boolean;
};

export default function TaskProgressBar({
  items,
}: {
  items: ChecklistItem[];
}) {
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.completed).length;

  const progress =
    totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : 0;

  return (
    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-300">
          Task Progress
        </p>

        <p className="text-sm font-bold text-blue-400">
          {progress}%
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {completedItems} of {totalItems} checklist items completed
      </p>
    </div>
  );
}
