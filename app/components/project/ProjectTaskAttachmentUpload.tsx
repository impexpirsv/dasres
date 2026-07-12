"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export default function ProjectTaskAttachmentUpload({
  taskId,
}: {
  taskId: number;
}) {
  const t = useTranslations("projectTaskAttachmentUpload");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function clearFile() {
    setFile(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      !ALLOWED_FILE_TYPES.includes(
        selectedFile.type as (typeof ALLOWED_FILE_TYPES)[number],
      )
    ) {
      alert(t("invalidType"));
      clearFile();
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      alert(t("fileTooLarge"));
      clearFile();
      return;
    }

    setFile(selectedFile);
  }

  async function uploadFile() {
    if (!file) {
      alert(t("selectFile"));
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/project-tasks/${taskId}/attachments`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || t("uploadError"));
        return;
      }

      clearFile();
      router.refresh();
    } catch {
      alert(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">
        {t("title")}
      </h3>

      <label
        htmlFor={`task-attachment-${taskId}`}
        className="mb-1 block text-xs font-medium text-slate-500"
      >
        {t("fileLabel")}
      </label>

      <input
        ref={inputRef}
        id={`task-attachment-${taskId}`}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx"
        disabled={loading}
        onChange={handleFileChange}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 file:me-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-200 hover:file:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <p className="mt-2 text-xs text-slate-500">
        {t("helpText")}
      </p>

      {file && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
          <p className="break-all text-sm font-medium text-slate-300">
            {file.name}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {t("fileSize", {
              size: (file.size / 1024 / 1024).toFixed(2),
            })}
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void uploadFile()}
          disabled={loading || !file}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? t("uploading") : t("upload")}
        </button>

        {file && (
          <button
            type="button"
            onClick={clearFile}
            disabled={loading}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("clear")}
          </button>
        )}
      </div>
    </div>
  );
}