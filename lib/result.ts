export type Success<T> = {
  readonly ok: true;
  readonly value: T;
};

export type Failure<E> = {
  readonly ok: false;
  readonly error: E;
};

export type Result<T, E> = Success<T> | Failure<E>;

export function success<T>(value: T): Success<T> {
  return {
    ok: true,
    value,
  };
}

export function failure<E>(error: E): Failure<E> {
  return {
    ok: false,
    error,
  };
}

export function isSuccess<T, E>(
  result: Result<T, E>,
): result is Success<T> {
  return result.ok;
}

export function isFailure<T, E>(
  result: Result<T, E>,
): result is Failure<E> {
  return !result.ok;
}

export function mapResult<T, U, E>(
  result: Result<T, E>,
  mapper: (value: T) => U,
): Result<U, E> {
  return result.ok
    ? success(mapper(result.value))
    : result;
}

export function mapResultError<T, E, F>(
  result: Result<T, E>,
  mapper: (error: E) => F,
): Result<T, F> {
  return result.ok
    ? result
    : failure(mapper(result.error));
}

export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  mapper: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok
    ? mapper(result.value)
    : result;
}

export function unwrapResult<T, E>(
  result: Result<T, E>,
): T {
  if (result.ok) {
    return result.value;
  }

  throw result.error;
}

export async function tryResult<T>(
  operation: () => Promise<T>,
): Promise<Result<T, unknown>> {
  try {
    return success(await operation());
  } catch (error) {
    return failure(error);
  }
}
