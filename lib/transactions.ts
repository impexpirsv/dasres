import {
  Prisma,
  PrismaClient,
} from "@prisma/client";

import { prisma } from "./prisma";

export type TransactionClient =
  Prisma.TransactionClient;

export type TransactionOperation<T> = (
  transaction: TransactionClient,
) => Promise<T>;

export type TransactionOptions = {
  readonly isolationLevel?:
    Prisma.TransactionIsolationLevel;
  readonly maxWait?: number;
  readonly timeout?: number;
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
};

const DEFAULT_MAX_WAIT_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 75;
const MAX_RETRY_DELAY_MS = 1_000;

const RETRYABLE_PRISMA_CODES = new Set([
  "P2034",
]);

function assertNonNegativeInteger(
  value: number,
  fieldName: string,
): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `${fieldName} must be a non-negative integer.`,
    );
  }
}

function assertPositiveInteger(
  value: number,
  fieldName: string,
): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(
      `${fieldName} must be a positive integer.`,
    );
  }
}

function isRetryableTransactionError(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    RETRYABLE_PRISMA_CODES.has(error.code)
  );
}

function calculateRetryDelay(
  attempt: number,
  baseDelayMs: number,
): number {
  const exponentialDelay = Math.min(
    baseDelayMs * 2 ** attempt,
    MAX_RETRY_DELAY_MS,
  );

  const jitter = Math.floor(
    Math.random() * Math.max(1, baseDelayMs),
  );

  return exponentialDelay + jitter;
}

async function sleep(
  milliseconds: number,
): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function runInTransaction<T>(
  operation: TransactionOperation<T>,
  options: TransactionOptions = {},
  client: PrismaClient = prisma,
): Promise<T> {
  const {
    isolationLevel =
      Prisma.TransactionIsolationLevel.Serializable,
    maxWait = DEFAULT_MAX_WAIT_MS,
    timeout = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  } = options;

  assertPositiveInteger(maxWait, "maxWait");
  assertPositiveInteger(timeout, "timeout");
  assertNonNegativeInteger(
    maxRetries,
    "maxRetries",
  );
  assertNonNegativeInteger(
    retryDelayMs,
    "retryDelayMs",
  );

  let attempt = 0;

  while (true) {
    try {
      return await client.$transaction(
        operation,
        {
          isolationLevel,
          maxWait,
          timeout,
        },
      );
    } catch (error) {
      if (
        !isRetryableTransactionError(error) ||
        attempt >= maxRetries
      ) {
        throw error;
      }

      const delay = calculateRetryDelay(
        attempt,
        retryDelayMs,
      );

      attempt += 1;

      if (delay > 0) {
        await sleep(delay);
      }
    }
  }
}
