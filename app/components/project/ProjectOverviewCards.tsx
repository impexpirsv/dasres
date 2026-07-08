import ProjectProgressCard from "./ProjectProgressCard";
import StatCard from "../StatCard";

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
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const openTasks = totalTasks - completedTasks;

  return (
    <section className="space-y-6">
      <ProjectProgressCard tasks={tasks} />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Customer"
          value={customer}
        />

        <StatCard
          title="Category"
          value={category}
        />

        <StatCard
          title="Open Tasks"
          value={openTasks}
          color="yellow"
        />

        <StatCard
          title="Completed Tasks"
          value={completedTasks}
          color="green"
        />

        <StatCard
          title="Steps"
          value={`${completedSteps} / ${totalSteps}`}
          subtitle="Completed"
        />
      </div>
    </section>
  );
}