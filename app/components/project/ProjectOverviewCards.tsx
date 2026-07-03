import ProjectProgressCard from "./ProjectProgressCard";

type ProjectTask = {
  id: number;
  status: string;
};

export default function ProjectOverviewCards({
  customer,
  category,
  completedSteps,
  totalSteps,
  tasks,
}: {
  customer: string;
  category: string;
  completedSteps: number;
  totalSteps: number;
  tasks: ProjectTask[];
}) {
  return (
    <>
      <ProjectProgressCard tasks={tasks} />

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-500 text-sm">Customer</p>

          <p className="text-xl font-bold mt-2">
            {customer}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-500 text-sm">Category</p>

          <p className="text-xl font-bold mt-2">
            {category}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-500 text-sm">Steps</p>

          <p className="text-xl font-bold mt-2">
            {completedSteps} / {totalSteps} Completed
          </p>
        </div>
      </div>
    </>
  );
}