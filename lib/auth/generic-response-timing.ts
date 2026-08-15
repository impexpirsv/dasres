import { randomInt } from "node:crypto";

const MINIMUM_RESPONSE_TIME_MS = 850;
const RESPONSE_JITTER_RANGE_MS = 150;

export async function waitForGenericAuthResponse(startedAt: number): Promise<void> {
  const targetDuration = MINIMUM_RESPONSE_TIME_MS + randomInt(RESPONSE_JITTER_RANGE_MS);
  const remainingDelay = targetDuration - (Date.now() - startedAt);
  if (remainingDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingDelay));
  }
}
