export type Status =
  | "PENDING"
  | "OPEN"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED"
  | "CLOSED"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED";

function getStatusStyle(status: Status) {
  switch (status) {
    case "OPEN":
      return {
        label: "Open",
        className:
          "border-blue-500/30 bg-blue-500/10 text-blue-300",
      };

    case "IN_PROGRESS":
      return {
        label: "In Progress",
        className:
          "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
      };

    case "REVIEW":
      return {
        label: "Review",
        className:
          "border-purple-500/30 bg-purple-500/10 text-purple-300",
      };

    case "COMPLETED":
      return {
        label: "Completed",
        className:
          "border-green-500/30 bg-green-500/10 text-green-300",
      };

    case "APPROVED":
      return {
        label: "Approved",
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      };

    case "REJECTED":
      return {
        label: "Rejected",
        className:
          "border-red-500/30 bg-red-500/10 text-red-300",
      };

    case "PENDING":
      return {
        label: "Pending",
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-300",
      };

    case "CLOSED":
      return {
        label: "Closed",
        className:
          "border-slate-500/30 bg-slate-500/10 text-slate-300",
      };

    case "ACTIVE":
      return {
        label: "Active",
        className:
          "border-green-500/30 bg-green-500/10 text-green-300",
      };

    case "EXPIRED":
      return {
        label: "Expired",
        className:
          "border-orange-500/30 bg-orange-500/10 text-orange-300",
      };

    case "CANCELLED":
      return {
        label: "Cancelled",
        className:
          "border-red-500/30 bg-red-500/10 text-red-300",
      };

    default:
      return {
        label: status,
        className:
          "border-slate-500/30 bg-slate-500/10 text-slate-300",
      };
  }
}

export default function StatusBadge({
  status,
  small = false,
}: {
  status: Status;
  small?: boolean;
}) {
  const config = getStatusStyle(status);

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        font-semibold
        transition-all
        duration-200
        ${small ? "px-2 py-1 text-[11px]" : "px-3 py-1 text-xs"}
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}