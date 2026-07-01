type TimelineStep = {
  id: number;
  title: string;
  completed: boolean;
  completedAt: Date | null;
};

export default function ProjectTimeline({
  steps,
}: {
  steps: TimelineStep[];
}) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-5">
        Timeline Steps
      </h2>

      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                step.completed
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {step.completed ? "✓" : "•"}
            </div>

            <div>
              <p className="font-semibold">
                {step.title}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {step.completedAt
                  ? step.completedAt.toLocaleDateString()
                  : "Pending"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}