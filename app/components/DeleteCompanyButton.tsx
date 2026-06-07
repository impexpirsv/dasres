"use client";

import { useRouter } from "next/navigation";

export default function DeleteCompanyButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = confirm("Are you sure you want to delete this company?");

    if (!confirmDelete) return;

    const response = await fetch(`/api/companies/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.push("/companies");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg"
    >
      Delete Company
    </button>
  );
}