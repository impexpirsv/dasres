"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ChangePlanButton({
  userId,
  currentPlan,
}: {
  userId: number;
  currentPlan: string;
}) {
  const t = useTranslations("adminUsers.changePlan");

  const [plan, setPlan] = useState(currentPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updatePlan(value: string) {
    const previousPlan = plan;

    try {
      setError("");
      setLoading(true);
      setPlan(value);

      const response = await fetch(
        `/api/admin/users/${userId}/plan`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planType: value,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setPlan(previousPlan);
        setError(
          data?.message || t("errors.updateFailed"),
        );
      }
    } catch {
      setPlan(previousPlan);
      setError(t("errors.updateFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <select
        value={plan}
        disabled={loading}
        onChange={(e) =>
          updatePlan(e.target.value)
        }
        aria-label={t("label")}
        className="rounded bg-slate-800 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="FREE">
          {t("plans.free")}
        </option>

        <option value="GOLD">
          {t("plans.gold")}
        </option>

        <option value="DIAMOND">
          {t("plans.diamond")}
        </option>

        <option value="ENTERPRISE">
          {t("plans.enterprise")}
        </option>
      </select>

      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )

}