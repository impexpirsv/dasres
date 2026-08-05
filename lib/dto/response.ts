import type {
  AppErrorCode,
  AppErrorDetails,
} from "../errors";

export type ApiSuccessResponse<T> = {
  readonly success: true;
  readonly data: T;
  readonly meta?: Readonly<
    Record<string, unknown>
  >;
};

export type ApiErrorResponse = {
  readonly success: false;
  readonly error: {
    readonly code:
      | AppErrorCode
      | (string & {});
    readonly message: string;
    readonly details?: AppErrorDetails;
  };
};

export type ApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;

export function apiSuccess<T>(
  data: T,
  meta?: Readonly<Record<string, unknown>>,
): ApiSuccessResponse<T> {
  return meta
    ? { success: true, data, meta }
    : { success: true, data };
}
