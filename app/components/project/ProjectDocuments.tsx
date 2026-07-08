import ApproveDocumentButtons from "./ApproveDocumentButtons";
type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type Attachment = {
  id: number;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: Date;
  uploadedBy: UserOption | null;
  approvalStatus: string;
  approvedAt: Date | null;
  rejectionReason: string | null;
  approvedBy: UserOption | null;
};

type Task = {
  id: number;
  title: string;
  status: string;
  attachments: Attachment[];
};

function formatFileSize(size: number | null) {
  if (!size) return "Unknown size";

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentStatus(taskStatus: string) {
  if (taskStatus === "COMPLETED") {
    return {
      label: "Approved",
      className: "bg-green-500/10 text-green-300 border-green-500/30",
    };
  }

  if (taskStatus === "REVIEW") {
    return {
      label: "Review",
      className: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    };
  }

  return {
    label: "Pending",
    className: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  };
}

export default function ProjectDocuments({
  tasks,
  isAdmin,
}: {
  tasks: Task[];
  isAdmin: boolean;
}) {
  const documents = tasks.flatMap((task) =>
    task.attachments.map((attachment) => ({
      ...attachment,
      taskTitle: task.title,
      taskStatus: task.status,
    })),
  );

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Document Center</h2>
          <p className="mt-1 text-sm text-slate-400">
            Centralized project and trade document workspace.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-cyan-300">
          {documents.length} Documents
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs text-slate-500">Commercial Invoice</p>
          <p className="mt-2 text-sm font-bold text-slate-200">Required</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs text-slate-500">Packing List</p>
          <p className="mt-2 text-sm font-bold text-slate-200">Required</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs text-slate-500">Bill of Lading</p>
          <p className="mt-2 text-sm font-bold text-slate-200">Optional</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs text-slate-500">Insurance Certificate</p>
          <p className="mt-2 text-sm font-bold text-slate-200">Optional</p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-10 text-center">
          <div className="text-4xl">📄</div>
          <h3 className="mt-4 text-lg font-bold text-white">
            No documents uploaded yet
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Documents uploaded inside project tasks will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => {
            const status = getDocumentStatus(document.taskStatus);

            return (
              <div
                key={document.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-cyan-500/50"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-xl">
                        📄
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">
                          {document.fileName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Linked task: {document.taskTitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>

                    <span className="text-xs text-slate-500">
                      {formatFileSize(document.fileSize)}
                    </span>

                    <span className="text-xs text-slate-500">
                      {document.createdAt.toLocaleDateString("en-US")}
                    </span>

                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Open
                    </a>
                    {isAdmin && document.approvalStatus === "PENDING" && (
                      <ApproveDocumentButtons documentId={document.id} />
                    )}
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
                  Uploaded by{" "}
                  {document.uploadedBy?.name ||
                    document.uploadedBy?.email ||
                    "Unknown user"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
