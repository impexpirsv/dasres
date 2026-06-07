"use client";

import { useRouter } from "next/navigation";

export default function MakeAdminButton({
  id,
}: {
  id: number;
}) {
  const router = useRouter();

  async function makeAdmin() {
    const response = await fetch(
      `/api/users/${id}`,
      {
        method: "PUT",
      }
    );

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={makeAdmin}
      className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded"
    >
      Make Admin
    </button>
  );
}