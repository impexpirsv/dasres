import {
  AppError,
  isAppError,
  toAppError,
} from "../errors";
import {
  serviceFailure,
  serviceSuccess,
  type ServiceResult,
} from "./service-result";

export abstract class BaseService {
  protected async execute<T>(
    operation: () => Promise<T>,
    fallbackMessage = "Service operation failed.",
  ): Promise<ServiceResult<T>> {
    try {
      return serviceSuccess(await operation());
    } catch (error) {
      return serviceFailure(
        isAppError(error)
          ? error
          : toAppError(error, fallbackMessage),
      );
    }
  }

  protected assert(
    condition: unknown,
    error: AppError,
  ): asserts condition {
    if (!condition) {
      throw error;
    }
  }
}
