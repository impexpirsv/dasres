export function canAccessProjectTaskAttachments({
  userId,
  userRole,
  projectCreatedBy,
  projectAssignedTo,
}: {
  userId: number;
  userRole: string;
  projectCreatedBy: number | null;
  projectAssignedTo: number | null;
}): boolean {
  return (
    userRole === "admin" ||
    projectCreatedBy === userId ||
    projectAssignedTo === userId
  );
}
