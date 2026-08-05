import type { DomainEvent } from "./events";
import type { EntityId } from "./types";

export abstract class AggregateRoot {
  readonly id: EntityId;

  private domainEvents: DomainEvent[] = [];

  protected constructor(id: EntityId) {
    this.id = id;
  }

  protected recordDomainEvent(
    event: DomainEvent,
  ): void {
    if (event.aggregateId !== this.id) {
      throw new Error(
        "Domain event aggregateId does not match aggregate root id.",
      );
    }

    this.domainEvents.push(event);
  }

  getDomainEvents(): readonly DomainEvent[] {
    return [...this.domainEvents];
  }

  pullDomainEvents(): readonly DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
