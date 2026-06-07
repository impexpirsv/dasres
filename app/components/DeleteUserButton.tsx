"use client";

import { useRouter } from "next/navigation";

export default function DeleteUserButton({
  id,
}: {
  id: number;
}) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = confirm(
      "Delete this user?"
    );

    if (!confirmed) return;

    const response = await fetch(
      `/api/users/${id}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded"
    >
      Delete
    </button>
  );
}