"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type CommentUser = {
  id: number;
  name: string;
  email: string;
};

type TaskComment = {
  id: number;
  taskId: number;
  authorId: number | null;
  parentId: number | null;
  content: string;
  isDeleted: boolean;
  editedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  author: CommentUser | null;
  replies?: TaskComment[];
};

export default function ProjectTaskComments({
  taskId,
  comments,
}: {
  taskId: number;
  comments: TaskComment[];
}) {
  const t = useTranslations("projectTaskComments");
  const locale = useLocale();
  const router = useRouter();

  const [localComments, setLocalComments] =
    useState<TaskComment[]>(comments);

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  function formatDate(value: Date | string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("unknownDate");
    }

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  async function createComment() {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      alert(t("commentRequired"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/project-tasks/${taskId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: trimmedContent,
            parentId: null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || t("createError"));
        return;
      }

      if (data.comment) {
        setLocalComments((currentComments) => [
          ...currentComments,
          data.comment,
        ]);
      }

      setContent("");
      router.refresh();
    } catch {
      alert(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  function renderComment(
    comment: TaskComment,
    isReply = false,
  ) {
    const authorName =
      comment.author?.name ||
      comment.author?.email ||
      t("unknownAuthor");

    return (
      <div
        key={comment.id}
        className={`rounded-xl border border-slate-800 p-3 ${
          isReply
            ? "bg-slate-900"
            : "bg-slate-950"
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-slate-500">
          <span>{authorName}</span>

          <span aria-hidden="true">·</span>

          <time dateTime={new Date(comment.createdAt).toISOString()}>
            {formatDate(comment.createdAt)}
          </time>

          {comment.editedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>{t("edited")}</span>
            </>
          )}
        </div>

        <p
          className={`mt-2 whitespace-pre-wrap break-words text-sm ${
            comment.isDeleted
              ? "italic text-slate-500"
              : "text-slate-300"
          }`}
        >
          {comment.isDeleted
            ? t("deletedComment")
            : comment.content}
        </p>

        {(comment.replies?.length ?? 0) > 0 && (
          <div className="mt-3 space-y-2 border-s border-slate-800 ps-3">
            {comment.replies?.map((reply) =>
              renderComment(reply, true),
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">
        {t("title")}
      </h3>

      <div className="space-y-3">
        {localComments.length === 0 ? (
          <p className="text-xs text-slate-500">
            {t("empty")}
          </p>
        ) : (
          localComments.map((comment) =>
            renderComment(comment),
          )
        )}
      </div>

      <div className="mt-4">
        <label
          htmlFor={`task-comment-${taskId}`}
          className="sr-only"
        >
          {t("commentLabel")}
        </label>

        <textarea
          id={`task-comment-${taskId}`}
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          placeholder={t("placeholder")}
          rows={3}
          disabled={loading}
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          type="button"
          onClick={() => void createComment()}
          disabled={loading || !content.trim()}
          className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? t("posting") : t("postComment")}
        </button>
      </div>
    </div>
  );
}