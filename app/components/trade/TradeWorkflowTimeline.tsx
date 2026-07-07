const steps = [
  "Inquiry",
  "Quotation",
  "Negotiation",
  "Contract",
  "Documents",
  "Customs",
  "Shipping",
  "Inspection",
  "Insurance",
  "Delivery",
  "Completed",
];

export default function TradeWorkflowTimeline({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-6 text-xl font-bold text-white">
        Trade Workflow
      </h2>

      <div className="flex overflow-x-auto pb-3">
        {steps.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;

          return (
            <div
              key={step}
              className="flex items-center"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-bold transition ${
                    done
                      ? "bg-green-500 text-white"
                      : active
                        ? "bg-blue-500 text-white ring-4 ring-blue-500/20"
                        : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {done ? "✓" : index + 1}
                </div>

                <span className="mt-2 w-24 text-center text-xs text-slate-300">
                  {step}
                </span>
              </div>

              {index !== steps.length - 1 && (
                <div
                  className={`mx-3 h-1 w-20 rounded ${
                    done
                      ? "bg-green-500"
                      : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}