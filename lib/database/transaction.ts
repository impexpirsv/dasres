import type {
  Prisma,
  PrismaClient,
} from "@prisma/client";

import {
  runInTransaction,
  type TransactionClient,
  type TransactionOperation,
  type TransactionOptions,
} from "../transactions";

export type DatabaseTransaction =
  TransactionClient;

export type DatabaseTransactionOptions =
  TransactionOptions;

export interface TransactionManager {
  run<T>(
    operation: TransactionOperation<T>,
    options?: TransactionOptions,
  ): Promise<T>;
}

export class PrismaTransactionManager
  implements TransactionManager
{
  constructor(
    private readonly client: PrismaClient,
    private readonly defaults: TransactionOptions = {},
  ) {}

  run<T>(
    operation: TransactionOperation<T>,
    options: TransactionOptions = {},
  ): Promise<T> {
    return runInTransaction(
      operation,
      {
        ...this.defaults,
        ...options,
      },
      this.client,
    );
  }
}

export function createTransactionManager(
  client: PrismaClient,
  defaults: TransactionOptions = {},
): TransactionManager {
  return new PrismaTransactionManager(
    client,
    defaults,
  );
}

export type TransactionIsolationLevel =
  Prisma.TransactionIsolationLevel;
