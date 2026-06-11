
export function getCaseLimit(planType: string) {
  switch (planType) {
    case "GOLD":
      return 20;

    case "DIAMOND":
      return 999999;

    case "ENTERPRISE":
      return 999999;

    default:
      return 3;
  }
}

export function getBestPlan(
  plans: string[]
) {
  if (plans.includes("ENTERPRISE")) {
    return "ENTERPRISE";
  }

  if (plans.includes("DIAMOND")) {
    return "DIAMOND";
  }

  if (plans.includes("GOLD")) {
    return "GOLD";
  }

  return "FREE";
}