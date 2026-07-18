export type DashboardUser = {
  id: number;
  role: string;
};

export type DashboardStats = {
  pendingCompaniesCount: number;
  pendingExpertsCount: number;
  totalReviewsCount: number;
  premiumUsersCount: number;
  usersCount: number;
  expertsCount: number;
  companiesCount: number;
  opportunitiesCount: number;
  savedCasesCount: number;
  savedCompaniesCount: number;
  savedExpertsCount: number;
  unreadNotificationsCount: number;
  openTicketsCount: number;
};

export type DashboardCaseStats = {
  activeCasesUsed: number;
  totalUserCases: number;
  completedUserCases: number;
  openCasesCount: number;
  inProgressCasesCount: number;
  completedCasesCount: number;
  successRate: number;
};

export type DashboardProposalStats = {
  proposalsUsed: number;
  myProposalsCount: number;
  acceptedProposalsCount: number;
  rejectedProposalsCount: number;
  proposalSuccessRate: number;
};