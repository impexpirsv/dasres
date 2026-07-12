"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";
import ApproveDocumentButtons from "./ApproveDocumentButtons";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type Attachment = {
  id: number;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: Date | string;
  uploadedBy: UserOption | null;
  approvalStatus: string;
  approvedAt: Date | string | null;
  rejectionReason: string | null;
  approvedBy: UserOption | null;
};

type Task = {
  id: number;
  title: string;
  status: string;
  attachments: Attachment[];
};

type ProjectDocument = Attachment & {
  taskId: number;
  taskTitle: string;
  taskStatus: string;
};

const DOCUMENT_REQUIREMENTS = [
  {
    key: "commercialInvoice",
    required: true,
  },
  {
    key: "packingList",
    required: true,
  },
  {
    key: "billOfLading",
    required: false,
  },
  {
    key: "insuranceCertificate",
    required: false,
  },
] as const;

function normalizeApprovalStatus(
  status: string,
): ApprovalStatus {
  switch (status) {
    case "APPROVED":
      return "APPROVED";

    case "REJECTED":
      return "REJECTED";

    default:
      return "PENDING";
  }
}

export default function ProjectDocuments({
  tasks,
  isAdmin,
}: {
  tasks: Task[];
  isAdmin: boolean;
}) {
  const t = useTranslations("projectDocuments");
  const locale = useLocale();

  const initialDocuments = useMemo<ProjectDocument[]>(
    () =>
      tasks.flatMap((task) =>
        task.attachments.map((attachment) => ({
          ...attachment,
          taskId: task.id,
          taskTitle: task.title,
          taskStatus: task.status,
        })),
      ),
    [tasks],
  );

  const [documents, setDocuments] =
    useState<ProjectDocument[]>(initialDocuments);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [locale],
  );

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
      }),
    [locale],
  );

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort((first, second) => {
        const firstDate = new Date(
          first.createdAt,
        ).getTime();

        const secondDate = new Date(
          second.createdAt,
        ).getTime();

        const normalizedFirstDate =
          Number.isNaN(firstDate) ? 0 : firstDate;

        const normalizedSecondDate =
          Number.isNaN(secondDate) ? 0 : secondDate;

        return (
          normalizedSecondDate -
          normalizedFirstDate
        );
      }),
    [documents],
  );

  function formatFileSize(
    size: number | null,
  ) {
    if (
      size === null ||
      !Number.isFinite(size) ||
      size < 0
    ) {
      return t("unknownSize");
    }

    if (size < 1024) {
      return t("fileSize.bytes", {
        size: numberFormatter.format(size),
      });
    }

    if (size < 1024 * 1024) {
      return t("fileSize.kilobytes", {
        size: numberFormatter.format(
          size / 1024,
        ),
      });
    }

    return t("fileSize.megabytes", {
      size: numberFormatter.format(
        size / (1024 * 1024),
      ),
    });
  }

  function formatDate(
    value: Date | string,
  ) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("unknownDate");
    }

    return dateFormatter.format(date);
  }

  function getApprovalStatus(
    value: string,
  ) {
    const status =
      normalizeApprovalStatus(value);

    switch (status) {
      case "APPROVED":
        return {
          label: t(
            "approvalStatuses.approved",
          ),
          className:
            "border-green-500/30 bg-green-500/10 text-green-300",
        };

      case "REJECTED":
        return {
          label: t(
            "approvalStatuses.rejected",
          ),
          className:
            "border-red-500/30 bg-red-500/10 text-red-300",
        };

      default:
        return {
          label: t(
            "approvalStatuses.pending",
          ),
          className:
            "border-amber-500/30 bg-amber-500/10 text-amber-300",
        };
    }
  }

  function handleDocumentStatusChange(
    documentId: number,
    status: "APPROVED" | "REJECTED",
  ) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === documentId
          ? {
              ...document,
              approvalStatus: status,
              approvedAt:
                status === "APPROVED"
                  ? new Date()
                  : document.approvedAt,
            }
          : document,
      ),
    );
  }

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("title")}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {t("description")}
          </p>
        </div>

        <div className="w-fit rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-cyan-300">
          {t("documentCount", {
            count: documents.length,
          })}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DOCUMENT_REQUIREMENTS.map(
          (requirement) => (
            <div
              key={requirement.key}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
            >
              <p className="text-xs text-slate-500">
                {t(
                  `requirements.${requirement.key}`,
                )}
              </p>

              <p
                className={`mt-2 text-sm font-bold ${
                  requirement.required
                    ? "text-amber-300"
                    : "text-slate-200"
                }`}
              >
                {requirement.required
                  ? t("required")
                  : t("optional")}
              </p>
            </div>
          ),
        )}
      </div>

      {sortedDocuments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-10 text-center">
          <div
            aria-hidden="true"
            className="text-4xl"
          >
            📄
          </div>

          <h3 className="mt-4 text-lg font-bold text-white">
            {t("emptyState.title")}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {t("emptyState.description")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDocuments.map((document) => {
            const normalizedStatus =
              normalizeApprovalStatus(
                document.approvalStatus,
              );

            const status =
              getApprovalStatus(
                document.approvalStatus,
              );

            const uploader =
              document.uploadedBy?.name ||
              document.uploadedBy?.email ||
              t("unknownUser");

            return (
              <article
                key={document.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-cyan-500/50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-xl"
                      >
                        📄
                      </div>

                      <div className="min-w-0">
                        <p
                          className="truncate font-bold text-white"
                          title={document.fileName}
                        >
                          {document.fileName}
                        </p>

                        <p className="mt-1 break-words text-xs text-slate-500">
                          {t("linkedTask", {
                            title:
                              document.taskTitle,
                          })}
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
                      {formatFileSize(
                        document.fileSize,
                      )}
                    </span>

                    <time
                      dateTime={
                        Number.isNaN(
                          new Date(
                            document.createdAt,
                          ).getTime(),
                        )
                          ? undefined
                          : new Date(
                              document.createdAt,
                            ).toISOString()
                      }
                      className="text-xs text-slate-500"
                    >
                      {formatDate(
                        document.createdAt,
                      )}
                    </time>

                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      {t("open")}
                    </a>

                    {isAdmin &&
                      normalizedStatus ===
                        "PENDING" && (
                        <ApproveDocumentButtons
                          documentId={
                            document.id
                          }
                          onStatusChange={
                            handleDocumentStatusChange
                          }
                        />
                      )}
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
                  {t("uploadedBy", {
                    name: uploader,
                  })}
                </div>

                {normalizedStatus ===
                  "REJECTED" &&
                  document.rejectionReason && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2">
                      <p className="text-xs font-semibold text-red-300">
                        {t("rejectionReason")}
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-red-200/80">
                        {
                          document.rejectionReason
                        }
                      </p>
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}