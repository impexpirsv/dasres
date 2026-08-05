import type { AppError } from "../errors";
import {
  failure,
  success,
  type Failure,
  type Result,
  type Success,
} from "../result";

export type ServiceSuccess<T> = Success<T>;
export type ServiceFailure = Failure<AppError>;
export type ServiceResult<T> = Result<T, AppError>;

export function serviceSuccess<T>(
  value: T,
): ServiceSuccess<T> {
  return success(value);
}

export function serviceFailure(
  error: AppError,
): ServiceFailure {
  return failure(error);
}
