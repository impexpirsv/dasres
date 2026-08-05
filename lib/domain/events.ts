import type {
  ActorReference,
  CorrelationContext,
  DomainMetadata,
  EntityId,
  JsonValue,
} from "./types";

export type DomainEvent<
  TName extends string = string,
  TPayload extends JsonValue = JsonValue,
> = {
  readonly id: string;
  readonly name: TName;
  readonly aggregateType: string;
  readonly aggregateId: EntityId;
  readonly occurredAt: string;
  readonly version: number;
  readonly payload: TPayload;
  readonly actor?: ActorReference;
  readonly correlation?: CorrelationContext;
  readonly metadata?: DomainMetadata;
};

export type CreateDomainEventInput<
  TName extends string,
  TPayload extends JsonValue,
> = Omit<
  DomainEvent<TName, TPayload>,
  "id" | "occurredAt" | "version"
> & {
  readonly id?: string;
  readonly occurredAt?: Date | string;
  readonly version?: number;
};

function createEventId(): string {
  return globalThis.crypto.randomUUID();
}

function normalizeOccurredAt(
  value: Date | string | undefined,
): string {
  const date =
    value instanceof Date
      ? value
      : value
        ? new Date(value)
        : new Date();

  if (Number.isNaN(date.getTime())) {
    throw new TypeError(
      "Domain event occurredAt must be a valid date.",
    );
  }

  return date.toISOString();
}

function assertNonEmpty(
  value: string,
  fieldName: string,
): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new TypeError(
      `${fieldName} must be a non-empty string.`,
    );
  }

  return normalized;
}

export function createDomainEvent<
  TName extends string,
  TPayload extends JsonValue,
>(
  input: CreateDomainEventInput<TName, TPayload>,
): DomainEvent<TName, TPayload> {
  const version = input.version ?? 1;

  if (!Number.isInteger(version) || version <= 0) {
    throw new RangeError(
      "Domain event version must be a positive integer.",
    );
  }

  return Object.freeze({
    id: input.id ?? createEventId(),
    name: assertNonEmpty(input.name, "name") as TName,
    aggregateType: assertNonEmpty(
      input.aggregateType,
      "aggregateType",
    ),
    aggregateId: input.aggregateId,
    occurredAt: normalizeOccurredAt(input.occurredAt),
    version,
    payload: input.payload,
    ...(input.actor ? { actor: input.actor } : {}),
    ...(input.correlation
      ? { correlation: input.correlation }
      : {}),
    ...(input.metadata
      ? { metadata: input.metadata }
      : {}),
  });
}

export type DomainEventHandler<
  TEvent extends DomainEvent = DomainEvent,
> = (event: TEvent) => Promise<void> | void;

export interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: readonly DomainEvent[]): Promise<void>;
}
