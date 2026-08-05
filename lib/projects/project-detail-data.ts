import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma";

export const PROJECT_DETAIL_TABS = [
  "overview",
  "tasks",
  "board",
  "calendar",
  "gantt",
  "workload",
  "documents",
  "messages",
  "activity",
  "timeline",
] as const;

export type ProjectDetailTab =
  (typeof PROJECT_DETAIL_TABS)[number];

export function isProjectDetailTab(
  value: string | undefined,
): value is ProjectDetailTab {
  return PROJECT_DETAIL_TABS.includes(
    value as ProjectDetailTab,
  );
}

export async function getProjectDetailHeader(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      progress: true,
      createdBy: true,
      assignedTo: true,
      tradeCase: {
        select: {
          description: true,
        },
      },
    },
  });
}

const TASKS_TAB_TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  startDate: true,
  dueDate: true,
  assignedToId: true,
  progress: true,
  estimatedHours: true,
  loggedHours: true,
  remainingHours: true,
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  checklistItems: {
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      title: true,
      completed: true,
    },
  },
  attachments: {
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fileName: true,
      approvalStatus: true,
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  comments: {
    where: {
      parentId: null,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      taskId: true,
      authorId: true,
      parentId: true,
      content: true,
      isDeleted: true,
      editedAt: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      replies: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          taskId: true,
          authorId: true,
          parentId: true,
          content: true,
          isDeleted: true,
          editedAt: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  },
  dependsOn: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  dependents: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
} satisfies Prisma.ProjectTaskSelect;

export async function getProjectOverviewData(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      tasks: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          estimatedHours: true,
          loggedHours: true,
          remainingHours: true,
        },
      },
      tradeCase: {
        select: {
          category: true,
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
          steps: {
            orderBy: { id: "asc" },
            select: {
              completed: true,
            },
          },
        },
      },
    },
  });
}

export async function getProjectTasksData(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      tasks: {
        orderBy: { createdAt: "asc" },
        select: TASKS_TAB_TASK_SELECT,
      },
    },
  });
}

export async function getProjectBoardData(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      tasks: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          dueDate: true,
          assignedTo: {
            select: {
              name: true,
              email: true,
            },
          },
          attachments: {
            select: { id: true },
          },
          comments: {
            select: { id: true },
          },
          checklistItems: {
            select: {
              id: true,
              completed: true,
            },
          },
        },
      },
    },
  });
}

export async function getProjectCalendarData(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      tasks: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          startDate: true,
          dueDate: true,
        },
      },
    },
  });
}

export async function getProjectGanttData(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      tasks: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          startDate: true,
          dueDate: true,
          dependsOn: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

export async function getProjectWorkloadData(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      tasks: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          status: true,
          progress: true,
          dueDate: true,
          assignedToId: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function getProjectDocumentsData(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      tasks: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          status: true,
          attachments: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              fileSize: true,
              createdAt: true,
              approvalStatus: true,
              approvedAt: true,
              rejectionReason: true,
              uploadedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              approvedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getProjectMessagesData(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      conversations: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          messages: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              message: true,
              isRead: true,
              createdAt: true,
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getProjectActivityData(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      tradeCase: {
        select: {
          activities: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              action: true,
              details: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
}

export async function getProjectTimelineData(
  scope: Prisma.ProjectWhereInput,
) {
  return prisma.project.findFirst({
    where: scope,
    select: {
      tradeCase: {
        select: {
          steps: {
            orderBy: { id: "asc" },
            select: {
              id: true,
              title: true,
              completed: true,
              completedAt: true,
            },
          },
        },
      },
    },
  });
}
