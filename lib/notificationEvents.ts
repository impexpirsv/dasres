import { createNotification, createNotifications } from "./notifications";

export async function notifyTaskCompleted({
  userId,
  taskTitle,
  projectId,
}: {
  userId: number | null;
  taskTitle: string;
  projectId: number;
}) {
  if (!userId) return null;

  return createNotification({
    userId,
    title: "Task Completed",
    message: `"${taskTitle}" has been marked as completed.`,
    type: "TASK_COMPLETED",
    link: `/dashboard/projects/${projectId}`,
  });
}

export async function notifyTaskComment({
  userId,
  taskTitle,
  projectId,
}: {
  userId: number | null;
  taskTitle: string;
  projectId: number;
}) {
  if (!userId) return null;

  return createNotification({
    userId,
    title: "New Task Comment",
    message: `A new comment was added to "${taskTitle}".`,
    type: "TASK_COMMENT",
    link: `/dashboard/projects/${projectId}`,
  });
}

export async function notifyTaskAssigned({
  userId,
  taskTitle,
  projectId,
}: {
  userId: number | null;
  taskTitle: string;
  projectId: number;
}) {
  if (!userId) return null;

  return createNotification({
    userId,
    title: "New Task Assigned",
    message: `You have been assigned to "${taskTitle}".`,
    type: "TASK_ASSIGNED",
    link: `/dashboard/projects/${projectId}`,
  });
}

export async function notifyProjectMessage({
  userId,
  projectId,
}: {
  userId: number | null;
  projectId: number;
}) {
  if (!userId) return null;

  return createNotification({
    userId,
    title: "New Project Message",
    message: "You received a new message in your project workspace.",
    type: "PROJECT_MESSAGE",
    link: `/dashboard/projects/${projectId}`,
  });
}

export async function notifyDocumentUploaded({
  userId,
  fileName,
  projectId,
}: {
  userId: number | null;
  fileName: string;
  projectId: number;
}) {
  if (!userId) return null;

  return createNotification({
    userId,
    title: "New Document Uploaded",
    message: `A new document was uploaded: ${fileName}`,
    type: "DOCUMENT_UPLOADED",
    link: `/dashboard/projects/${projectId}`,
  });
}

export async function notifyDocumentApproved({
  userId,
  projectId,
}: {
  userId: number | null;
  projectId: number;
}) {
  if (!userId) return null;

  return createNotification({
    userId,
    title: "Document Approved",
    message: "Your uploaded document has been approved.",
    type: "DOCUMENT_APPROVED",
    link: `/dashboard/projects/${projectId}`,
  });
}

export async function notifyTicketUpdated({
  userIds,
  title,
  message,
  ticketId,
}: {
  userIds: number[];
  title: string;
  message: string;
  ticketId: number;
}) {
  return createNotifications(
    userIds.map((userId) => ({
      userId,
      title,
      message,
      type: "TICKET_UPDATED",
      link: `/dashboard/tickets/${ticketId}`,
    })),
  );
}
export async function notifyProposalSubmitted({
  userId,
  caseId,
}: {
  userId: number | null;
  caseId: number;
}) {
  if (!userId) return null;

  return createNotification({
    userId,
    title: "New Proposal Received",
    message: "A new proposal has been submitted for your trade case.",
    type: "PROPOSAL_SUBMITTED",
    link: `/dashboard/cases/${caseId}`,
  });
}

export async function notifyProposalAccepted({
  userId,
  caseId,
}: {
  userId: number | null;
  caseId: number;
}) {
  if (!userId) return null;

  return createNotification({
    userId,
    title: "Proposal Accepted",
    message: "Your proposal has been accepted.",
    type: "PROPOSAL_ACCEPTED",
    link: `/dashboard/cases/${caseId}`,
  });
}

export async function notifyProposalRejected({
  userId,
  caseId,
}: {
  userId: number | null;
  caseId: number;
}) {
  if (!userId) return null;

  return createNotification({
    userId,
    title: "Proposal Rejected",
    message: "Your proposal was not selected.",
    type: "PROPOSAL_REJECTED",
    link: `/dashboard/cases/${caseId}`,
  });
}

export async function notifyCompanyVerification({
  userId,
  approved,
  companyId,
}: {
  userId: number | null;
  approved: boolean;
  companyId: number;
}) {
  if (!userId) return null;

  return createNotification({
    userId,
    title: approved ? "Company Verified" : "Company Rejected",
    message: approved
      ? "Your company has been verified."
      : "Your company verification request was rejected.",
    type: approved ? "COMPANY_VERIFIED" : "COMPANY_REJECTED",
    link: `/companies/${companyId}`,
  });
}