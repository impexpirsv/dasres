import type { DashboardUser } from "./types";
import { getDashboardActivities } from "./activities";
import { getDashboardCaseStats } from "./cases";
import { getDashboardLatestItems } from "./latest";
import { getDashboardProposalStats } from "./proposals";
import { getDashboardStats } from "./stats";
import { getDashboardTasks } from "./tasks";
import { getDashboardTopRated } from "./topRated";

export async function getDashboardData(
  user: DashboardUser,
) {
  const [
    stats,
    caseStats,
    proposalStats,
    topRated,
    tasks,
    latest,
    recentActivities,
  ] = await Promise.all([
    getDashboardStats(user),
    getDashboardCaseStats(user),
    getDashboardProposalStats(user),
    getDashboardTopRated(),
    getDashboardTasks(user),
    getDashboardLatestItems(user),
    getDashboardActivities(user),
  ]);

  return {
    ...stats,
    ...caseStats,
    ...proposalStats,
    ...topRated,
    ...tasks,
    ...latest,
    recentActivities,
  };
}

export type DashboardData = Awaited<
  ReturnType<typeof getDashboardData>
>;