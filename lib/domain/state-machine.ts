export type StateTransition<
  TState extends string,
> = {
  readonly from: TState;
  readonly to: TState;
};

export type TransitionMap<
  TState extends string,
> = Readonly<
  Partial<Record<TState, readonly TState[]>>
>;

export class InvalidStateTransitionError<
  TState extends string,
> extends Error {
  readonly from: TState;
  readonly to: TState;

  constructor(from: TState, to: TState) {
    super(
      `Invalid state transition from "${from}" to "${to}".`,
    );
    this.name = "InvalidStateTransitionError";
    this.from = from;
    this.to = to;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StateMachine<TState extends string> {
  private readonly transitions: TransitionMap<TState>;

  constructor(transitions: TransitionMap<TState>) {
    this.transitions = transitions;
  }

  canTransition(from: TState, to: TState): boolean {
    if (from === to) {
      return false;
    }

    return (
      this.transitions[from]?.includes(to) ?? false
    );
  }

  assertTransition(from: TState, to: TState): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidStateTransitionError(from, to);
    }
  }

  transition(from: TState, to: TState): TState {
    this.assertTransition(from, to);
    return to;
  }

  getAllowedTransitions(
    from: TState,
  ): readonly TState[] {
    return [...(this.transitions[from] ?? [])];
  }
}
