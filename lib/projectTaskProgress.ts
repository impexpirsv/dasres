type ChecklistItem = {
  completed: boolean;
};

type TaskForProgress = {
  status: string;
  checklistItems?: ChecklistItem[];
};

function getStatusProgress(status: string) {
  switch (status) {
    case "TODO":
      return 0;

    case "IN_PROGRESS":
      return 35;

    case "REVIEW":
      return 80;

    case "COMPLETED":
      return 100;

    default:
      return 0;
  }
}

export function calculateTaskProgress(task: TaskForProgress) {
  const statusProgress = getStatusProgress(task.status);

  const checklistItems = task.checklistItems || [];

  if (checklistItems.length === 0) {
    return statusProgress;
  }

  const completedItems = checklistItems.filter(
    (item) => item.completed,
  ).length;

  const checklistProgress = Math.round(
    (completedItems / checklistItems.length) * 100,
  );

  return Math.round(statusProgress * 0.4 + checklistProgress * 0.6);
}