"use client";

import { useState } from "react";

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
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function createComment(parentId?: number) {
    if (!content.trim()) {
      alert("Comment is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/project-tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          parentId: parentId ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-300">
        Comments
      </p>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-500">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-3"
            >
              <div className="text-xs text-slate-500">
                {comment.author?.name || comment.author?.email || "Unknown"} ·{" "}
                {new Date(comment.createdAt).toLocaleString()}
                {comment.editedAt && " · edited"}
              </div>

              <p
                className={`mt-2 text-sm ${
                  comment.isDeleted ? "italic text-slate-500" : "text-slate-300"
                }`}
              >
                {comment.content}
              </p>

              {(comment.replies?.length ?? 0) > 0 && (
                <div className="mt-3 space-y-2 border-l border-slate-800 pl-3">
                  {comment.replies?.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-3"
                    >
                      <div className="text-xs text-slate-500">
                        {reply.author?.name || reply.author?.email || "Unknown"} ·{" "}
                        {new Date(reply.createdAt).toLocaleString()}
                        {reply.editedAt && " · edited"}
                      </div>

                      <p
                        className={`mt-2 text-sm ${
                          reply.isDeleted
                            ? "italic text-slate-500"
                            : "text-slate-300"
                        }`}
                      >
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows={3}
        className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
      />

      <button
        onClick={() => createComment()}
        disabled={loading}
        className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Posting..." : "Post Comment"}
      </button>
    </div>
  );
}