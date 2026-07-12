import { prisma } from "./prisma";

type NotificationType =
  | "PROPOSAL_SUBMITTED"
  | "PROPOSAL_ACCEPTED"
  | "PROPOSAL_REJECTED"
  | "PROJECT_MESSAGE"
  | "TASK_COMMENT"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_APPROVED"
  | "TASK_ASSIGNED"
  | "TASK_COMPLETED"
  | "DEADLINE_REMINDER"
  | "PROJECT_COMPLETED"
  | "TICKET_UPDATED"
  | "COMPANY_VERIFIED"
  | "COMPANY_REJECTED";
type CreateNotificationInput = {
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
};

export async function createNotification({
  userId,
  title,
  message,
  type,
  link,
}: CreateNotificationInput) {
  if (!userId) {
    return null;
  }

  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link,
    },
  });
}

export async function createNotifications(
  notifications: CreateNotificationInput[]
) {
  const validNotifications = notifications.filter(
    (notification) => notification.userId
  );

  if (validNotifications.length === 0) {
    return null;
  }

  return prisma.notification.createMany({
    data: validNotifications,
  });
}