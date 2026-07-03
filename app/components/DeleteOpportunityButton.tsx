"use client";

import { useRouter } from "next/navigation";

export default function DeleteOpportunityButton({
  id,
}: {
  id: number;
}) {
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = confirm(
      "Are you sure you want to delete this opportunity?"
    );

    if (!confirmDelete) return;

    const response = await fetch(
      `/api/opportunities/${id}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
     router.push("/dashboard/opportunities");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg"
    >
      Delete Opportunity
    </button>
  );
}