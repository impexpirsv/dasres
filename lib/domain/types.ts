export type EntityId = string | number;

export type JsonPrimitive =
  | string
  | number
  | boolean
  | null;

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type DomainMetadata = Readonly<
  Record<string, JsonValue>
>;

export type ActorReference = {
  readonly id: EntityId;
  readonly type: string;
};

export type CorrelationContext = {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly requestId?: string;
};
