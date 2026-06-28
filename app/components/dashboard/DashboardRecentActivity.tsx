import Link from "next/link";

type Activity = {
  id: number;
  action: string;
  details: string | null;
  caseId: number;
  createdAt: Date;
  user: {
    name: string | null;
  } | null;
  tradeCase: {
    title: string;
  };
};

function getActivityTitle(action: string) {
  switch (action) {
    case "PROPOSAL_SUBMITTED":
      return "📨 Proposal Submitted";
    case "PROPOSAL_ACCEPTED":
      return "✅ Proposal Accepted";
    case "PROPOSAL_REJECTED":
      return "❌ Proposal Rejected";
    case "CASE_COMPLETED":
      return "🏁 Case Completed";
    case "DOCUMENT_UPLOADED":
      return "📄 Document Uploaded";
    case "MESSAGE_SENT":
      return "💬 Message Sent";
    default:
      return action.replaceAll("_", " ");
  }
}

export default function DashboardRecentActivity({
  recentActivities,
}: {
  recentActivities: Activity[];
}) {
  return (
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Recent Activity</h2>
      </div>

      {recentActivities.length === 0 ? (
        <p className="text-slate-500">No activity found.</p>
      ) : (
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const badgeColor = activity.action.includes("MESSAGE")
              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
              : activity.action.includes("DOCUMENT")
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                : activity.action.includes("PROPOSAL")
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : activity.action.includes("CASE")
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    : "bg-slate-700 text-slate-300 border-slate-600";

            return (
              <div
                key={activity.id}
                className="border-b border-slate-800 pb-4 last:border-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">
                    {getActivityTitle(activity.action)}
                  </p>

                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeColor}`}
                  >
                    {activity.action.replaceAll("_", " ")}
                  </span>
                </div>

                {activity.details && (
                  <p className="text-slate-400 text-sm mt-1">
                    {activity.details}
                  </p>
                )}

                <p className="text-xs text-slate-500 mt-2">
                  {activity.user?.name || "System"} •{" "}
                  <Link
                    href={`/dashboard/cases/${activity.caseId}`}
                    className="text-blue-400 hover:underline"
                  >
                    {activity.tradeCase.title}
                  </Link>{" "}
                  • {activity.createdAt.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}