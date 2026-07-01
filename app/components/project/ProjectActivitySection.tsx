type Activity = {
  id: number;
  action: string;
  details: string | null;
  createdAt: Date;
};

export default function ProjectActivitySection({
  activities,
}: {
  activities: Activity[];
}) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-5">Recent Activity</h2>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-slate-500">No activity yet.</p>
        ) : (
          activities.slice(0, 8).map((activity) => (
            <div
              key={activity.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-4"
            >
              <p className="font-semibold">
                {activity.action.replaceAll("_", " ")}
              </p>

              {activity.details && (
                <p className="text-sm text-slate-400 mt-1">
                  {activity.details}
                </p>
              )}

              <p className="text-xs text-slate-500 mt-2">
                {activity.createdAt.toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}