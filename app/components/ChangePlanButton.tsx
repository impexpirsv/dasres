"use client";

import { useState } from "react";

export default function ChangePlanButton({
  userId,
  currentPlan,
}: {
  userId: number;
  currentPlan: string;
}) {
  const [plan, setPlan] =
    useState(currentPlan);

  async function updatePlan(
    value: string
  ) {
    setPlan(value);

    await fetch(
      `/api/admin/users/${userId}/plan`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          planType: value,
        }),
      }
    );
  }

  return (
    <select
      value={plan}
      onChange={(e) =>
        updatePlan(e.target.value)
      }
      className="bg-slate-800 rounded px-2 py-1"
    >
      <option value="FREE">
        FREE
      </option>

      <option value="GOLD">
        GOLD
      </option>

      <option value="DIAMOND">
        DIAMOND
      </option>

      <option value="ENTERPRISE">
        ENTERPRISE
      </option>
    </select>
  );
}