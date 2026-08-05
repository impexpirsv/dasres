import type { DomainEvent } from "../domain/events";

export type OutboxMessageStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED";

export type OutboxMessage = {
  readonly id: string;
  readonly event: DomainEvent;
  readonly status: OutboxMessageStatus;
  readonly attempts: number;
  readonly availableAt: string;
  readonly createdAt: string;
  readonly processedAt?: string;
  readonly lastError?: string;
};

export type EnqueueOutboxOptions = {
  readonly availableAt?: Date;
};

export interface OutboxWriter {
  enqueue(
    event: DomainEvent,
    options?: EnqueueOutboxOptions,
  ): Promise<void>;

  enqueueMany(
    events: readonly DomainEvent[],
    options?: EnqueueOutboxOptions,
  ): Promise<void>;
}

export interface OutboxReader {
  claimPending(limit: number): Promise<readonly OutboxMessage[]>;
  markProcessed(messageId: string): Promise<void>;
  markFailed(
    messageId: string,
    error: unknown,
    nextAvailableAt?: Date,
  ): Promise<void>;
}

export type OutboxRepository = OutboxWriter & OutboxReader;
